/** Delad hämtning av place-index för kombobox + mäklarfiltrering (klient). */

export type SwedenPlaceRow = {
  readonly id: string;
  readonly label: string;
  readonly sub?: string;
  readonly kind: string;
  readonly kk?: string;
};

export function buildLabelLookup(rows: readonly SwedenPlaceRow[]) {
  const m = new Map<string, string>();
  for (const r of rows) m.set(r.id, r.label);
  return m;
}

/** kommunkoder endast för `geo-*` (Stockholm-stads-delar löses utan geo). */
export function buildKKByGeoMap(rows: readonly SwedenPlaceRow[]) {
  const kkByGeoId = new Map<string, string>();
  for (const r of rows) {
    if (r.id.startsWith("geo-") && r.kk) kkByGeoId.set(r.id, r.kk);
  }
  return kkByGeoId;
}

let cache: Promise<{
  rows: SwedenPlaceRow[];
  labelById: Map<string, string>;
  kkByGeoId: Map<string, string>;
}> | null = null;

export async function loadSwedenPlaceIndex() {
  if (!cache)
    cache = (async () => {
      const res = await fetch("/sweden-places-search.json", { cache: "force-cache" });
      const rows = (await res.json()) as SwedenPlaceRow[];
      const labelById = buildLabelLookup(rows);
      const kkByGeoId = buildKKByGeoMap(rows);
      return { rows, labelById, kkByGeoId };
    })();
  return cache;
}
