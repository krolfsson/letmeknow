"use client";

import { memo, useCallback, useEffect, useRef, type ReactNode } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "@geoman-io/leaflet-geoman-free";
import "leaflet/dist/leaflet.css";

/** Synkar alla Geoman‑lager till en FeatureCollection eller null om tomt */
function GeoSync({
  onChange,
}: {
  onChange: (fc: GeoJSON.FeatureCollection | null) => void;
}) {
  const map = useMap();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const sync = useCallback(() => {
    type WithGJ = import("leaflet").Layer & {
      toGeoJSON?: (
        precision?: boolean | number,
      ) =>
        | GeoJSON.Feature
        | GeoJSON.FeatureCollection
        | GeoJSON.Geometry
        | null;
    };
    const layers = map.pm.getGeomanLayers(false) as WithGJ[];
    const features: GeoJSON.Feature[] = [];
    for (const layer of layers) {
      if (typeof layer.toGeoJSON !== "function") continue;
      const gj = layer.toGeoJSON(false);
      if (!gj) continue;
      if (gj.type === "Feature") features.push(gj);
      else if (gj.type === "FeatureCollection" && gj.features?.length)
        features.push(...gj.features);
    }
    onChangeRef.current(
      features.length > 0
        ? { type: "FeatureCollection", features }
        : null,
    );
  }, [map]);

  useEffect(() => {
    map.pm.addControls({
      position: "topright",
      drawPolygon: true,
      drawRectangle: true,
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawMarker: false,
      drawText: false,
      cutPolygon: false,
      rotateMode: false,
      dragMode: true,
      removalMode: true,
      oneBlock: true,
      drawControls: true,
      editControls: true,
      optionsControls: false,
      customControls: false,
    });

    map.on("pm:create", sync);
    map.on("pm:remove", sync);
    map.on("pm:update", sync);
    map.on("pm:cut", sync);
    sync();

    return () => {
      map.off("pm:create", sync);
      map.off("pm:remove", sync);
      map.off("pm:update", sync);
      map.off("pm:cut", sync);
      try {
        map.pm.removeControls();
      } catch {
        /* ignore */
      }
    };
  }, [map, sync]);

  return null;
}

const centerStockholm: [number, number] = [59.331, 18.069];

function MapInner({ children }: { children: ReactNode }) {
  return (
      <MapContainer
        center={centerStockholm}
        zoom={11}
        scrollWheelZoom
        className="isolate z-0 h-full min-h-[300px] w-full outline-none [&_.leaflet-pane]:rounded-lg"
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
      </MapContainer>
  );
}

export const BuyerAreaMap = memo(function BuyerAreaMap({
  onChange,
}: {
  onChange: (fc: GeoJSON.FeatureCollection | null) => void;
}) {
  return (
    <div className="rounded-lg border border-rule bg-bg">
      <p className="border-b border-rule px-3 py-2 text-[13px] text-subtle">
        Rita var du vill leta – polygon eller ruta på kartan. Ingen form = okej
        också.
      </p>
      <div className="h-[min(48vh,420px)] min-h-[280px] w-full">
        <MapInner>
          <GeoSync onChange={onChange} />
        </MapInner>
      </div>
    </div>
  );
});
