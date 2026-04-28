"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import type { Financing, Timeline } from "@/lib/buyers";
import { cn } from "@/lib/cn";

const BuyerAreaMap = dynamic(
  () => import("./buyer-area-map").then((m) => m.BuyerAreaMap),
  { loading: () => <MapSkeleton />, ssr: false },
);

function MapSkeleton() {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-rule text-sm text-subtle">
      Laddar karta…
    </div>
  );
}

const dwellingOptions = [
  { value: "lagenhet", label: "Lägenhet" },
  { value: "radhus_kedje", label: "Radhus / kedjehus" },
  { value: "villa_parhus", label: "Villa / parhus" },
  { value: "fritid", label: "Fritidshus" },
  { value: "ovrig", label: "Övrigt" },
];

const roomOptions = [
  { value: "1rok", label: "1 rok" },
  { value: "2rok", label: "2 rok" },
  { value: "3rok", label: "3 rok" },
  { value: "4rok", label: "4+ rok" },
  { value: "okort", label: "Spelar ingen roll på antal rum ännu" },
];

const labelCn = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-subtle";

const selectCn =
  "mt-1 w-full rounded-md border border-rule bg-bg px-3 py-2.5 text-[15px] text-fg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const inpCn =
  "mt-1 w-full rounded-md border border-rule bg-bg px-3 py-2.5 text-[15px] text-fg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

function CheckboxRow({
  checked,
  onChecked,
  label,
}: {
  checked: boolean;
  onChecked: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-md py-1.5 text-[15px]">
      <input
        type="checkbox"
        className="mt-1 accent-green"
        checked={checked}
        onChange={(e) => onChecked(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function FieldGroup({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-lg border border-rule p-5">
      <legend className="px-2 font-display text-[15px] font-semibold text-fg">{legend}</legend>
      <div className="mt-3 space-y-4">{children}</div>
    </fieldset>
  );
}

export default function BuyerForm() {
  const router = useRouter();
  const [mapGeoJson, setMapGeoJson] = useState<GeoJSON.FeatureCollection | null>(
    null,
  );

  const onMapChange = useCallback((fc: GeoJSON.FeatureCollection | null) => {
    setMapGeoJson(fc);
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dwellingType, setDwellingType] = useState("");
  const [rooms, setRooms] = useState("");
  const [areaSqmMin, setAreaSqmMin] = useState("");
  const [areaSqmMax, setAreaSqmMax] = useState("");
  const [budgetMinSEK, setBudgetMinSEK] = useState("");
  const [budgetMaxSEK, setBudgetMaxSEK] = useState("");
  const [timeline, setTimeline] = useState<Timeline>("nu");
  const [financing, setFinancing] = useState<Financing>("banklan");
  const [balcony, setBalcony] = useState(false);
  const [elevator, setElevator] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [parkingWanted, setParkingWanted] = useState(false);
  const [newerThan1990, setNewerThan1990] = useState(false);
  const [renovationOk, setRenovationOk] = useState(true);
  const [areaNotes, setAreaNotes] = useState("");

  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const timelineLabel = useMemo(
    () =>
      ({
        nu: "Snarast möjligt",
        "3man": "Inom cirka tre månader",
        "6man": "Inom cirka sex månader",
      }) satisfies Record<Timeline, string>,
    [],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    setBusy(true);

    const payload = {
      name,
      email,
      phone,
      dwellingType,
      rooms,
      areaSqmMin: areaSqmMin.trim() === "" ? null : areaSqmMin,
      areaSqmMax: areaSqmMax.trim() === "" ? null : areaSqmMax,
      budgetMinSEK: budgetMinSEK.replace(/\s+/g, ""),
      budgetMaxSEK: budgetMaxSEK.replace(/\s+/g, ""),
      timeline,
      financing,
      balcony,
      elevator,
      petFriendly,
      parkingWanted,
      newerThan1990,
      renovationOk,
      areaNotes,
      mapAreaGeoJson: mapGeoJson,
    };

    try {
      const res = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        id?: string;
        error?: string;
        missing?: string[];
      };
      if (!res.ok) {
        if (Array.isArray(data.missing))
          setSubmitErr(`Fyll i eller rätta: ${data.missing.join(", ")}.`);
        else setSubmitErr(data.error ?? "Kunde inte skicka. Testa igen.");
        return;
      }
      if (data.id) router.push(`/buyer/tack?id=${encodeURIComponent(data.id)}`);
      else router.push("/buyer/tack");
    } catch {
      setSubmitErr("Nätverksfel – är du online?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg pb-16">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-6 pb-8 pt-8">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-green">
          Köparsignal
        </p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-tight text-fg sm:text-[2.65rem] sm:leading-tight">
          Säg vad du vill ha på riktigt
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-subtle">
          Kolla i rutorna nedan och rita gärna var på kartan det känns rätt – från
          en huslängd till hela stadssiluetten.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 grid gap-10 lg:grid-cols-[1fr,min(46%,560px)] lg:gap-12 xl:gap-14"
          noValidate
        >
          <div className="space-y-8">
            <FieldGroup legend="Kontakt">
              <div>
                <label className={labelCn}>Namn</label>
                <input
                  className={inpCn}
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCn}>Mejl</label>
                  <input
                    className={inpCn}
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className={labelCn}>Telefon</label>
                  <input
                    className={inpCn}
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </FieldGroup>

            <FieldGroup legend="Boende och yta">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCn}>Boende</label>
                  <select
                    className={selectCn}
                    name="dwellingType"
                    required
                    value={dwellingType}
                    onChange={(e) => setDwellingType(e.target.value)}
                  >
                    <option value="">Välj…</option>
                    {dwellingOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCn}>Antal rum (ca)</label>
                  <select
                    className={selectCn}
                    name="rooms"
                    required
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                  >
                    <option value="">Välj…</option>
                    {roomOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCn}>kvm min</label>
                  <input
                    className={inpCn}
                    name="areaSqmMin"
                    inputMode="numeric"
                    placeholder="–"
                    value={areaSqmMin}
                    onChange={(e) => setAreaSqmMin(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCn}>kvm max</label>
                  <input
                    className={inpCn}
                    name="areaSqmMax"
                    inputMode="numeric"
                    placeholder="–"
                    value={areaSqmMax}
                    onChange={(e) => setAreaSqmMax(e.target.value)}
                  />
                </div>
              </div>
            </FieldGroup>

            <FieldGroup legend="Budget och tidplan">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCn}>Budget från (SEK)</label>
                  <input
                    className={inpCn}
                    name="budgetMinSEK"
                    inputMode="numeric"
                    placeholder="3800000"
                    required
                    value={budgetMinSEK}
                    onChange={(e) => setBudgetMinSEK(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCn}>Budget upp till (SEK)</label>
                  <input
                    className={inpCn}
                    name="budgetMaxSEK"
                    inputMode="numeric"
                    placeholder="4900000"
                    required
                    value={budgetMaxSEK}
                    onChange={(e) => setBudgetMaxSEK(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelCn}>Flytta in</label>
                <select
                  className={selectCn}
                  name="timeline"
                  required
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value as Timeline)}
                >
                  {(Object.entries(timelineLabel) as [Timeline, string][]).map(
                    ([value, lbl]) => (
                      <option key={value} value={value}>
                        {lbl}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <span className={labelCn}>Finansiering</span>
                <div className="mt-2 flex flex-wrap gap-3">
                  {(
                    [
                      ["kontant", "Kontant / eget kapital"],
                      ["banklan", "Bolån"],
                      ["osaker", "Osäker ännu"],
                    ] as const
                  ).map(([val, lab]) => (
                    <label
                      key={val}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border border-rule px-3 py-2 text-sm transition-colors",
                        financing === val
                          ? "border-green bg-green-mist/40 text-fg dark:bg-green-mist/20"
                          : "hover:border-green/50",
                      )}
                    >
                      <input
                        type="radio"
                        name="financing"
                        className="accent-green"
                        checked={financing === val}
                        onChange={() => setFinancing(val)}
                      />
                      {lab}
                    </label>
                  ))}
                </div>
              </div>
            </FieldGroup>

            <FieldGroup legend="Checklista — skrolla bara">
              <div className="grid gap-2 sm:grid-cols-2">
                <CheckboxRow checked={balcony} onChecked={setBalcony} label="Balkong eller terrass" />
                <CheckboxRow checked={elevator} onChecked={setElevator} label="Hiss" />
                <CheckboxRow checked={petFriendly} onChecked={setPetFriendly} label="Djur i bilden" />
                <CheckboxRow checked={parkingWanted} onChecked={setParkingWanted} label="Garage / plats" />
                <CheckboxRow checked={newerThan1990} onChecked={setNewerThan1990} label="Helst byggt efter 1990" />
                <CheckboxRow checked={renovationOk} onChecked={setRenovationOk} label="Renoveringsobjekt okej" />
              </div>
              <div>
                <label className={labelCn}>
                  Tillägg (gatan, ett hus eller helt öppet kort)
                </label>
                <textarea
                  className={cn(inpCn, "min-h-[88px] resize-y")}
                  name="areaNotes"
                  placeholder='T.ex. "nära mamma på Allévägen" eller hela innerstan'
                  rows={4}
                  value={areaNotes}
                  onChange={(e) => setAreaNotes(e.target.value)}
                />
              </div>
            </FieldGroup>

            {submitErr ? (
              <p className="rounded-md border border-rule bg-green-mist/50 px-3 py-2 text-sm text-fg dark:bg-green-soft/20">
                {submitErr}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 pb-8 lg:hidden">
              <Button type="submit" disabled={busy}>
                {busy ? "Skickar…" : "Skicka köpsignal"}
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/">Avbryt</Link>
              </Button>
            </div>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <BuyerAreaMap onChange={onMapChange} />
            {mapGeoJson?.features?.length ? (
              <p className="mt-2 text-[13px] text-green">
                {mapGeoJson.features.length === 1
                  ? "1 figur ritad ✓"
                  : `${mapGeoJson.features.length} figurer ✓`}
              </p>
            ) : (
              <p className="mt-2 text-[13px] text-subtle">
                Ännu inte ritat på kartan (valfritt).
              </p>
            )}
            <div className="mt-6 hidden flex-wrap items-center gap-4 lg:flex">
              <Button type="submit" disabled={busy}>
                {busy ? "Skickar…" : "Skicka köpsignal"}
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/">Avbryt</Link>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
