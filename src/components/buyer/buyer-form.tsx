"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { DualEndedRange } from "@/components/buyer/dual-ended-range";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import type { Timeline } from "@/lib/buyers";
import { cn } from "@/lib/cn";

const BuyerAreaMap = dynamic(
  () => import("./buyer-area-map").then((m) => m.BuyerAreaMap),
  { loading: () => <MapSkeleton />, ssr: false },
);

function MapSkeleton() {
  return (
    <div className="flex min-h-[200px] flex-1 items-center justify-center rounded-md border border-dashed border-rule text-[13px] text-subtle">
      Laddar karta…
    </div>
  );
}

const dwellingOptions = [
  { value: "bostadsratt", label: "Bostadsrätt" },
  { value: "radhus_kedje", label: "Radhus / kedjehus" },
  { value: "villa_parhus", label: "Villa / parhus" },
  { value: "fritid", label: "Fritidshus" },
  { value: "ovrig", label: "Övrigt" },
];

const KVM_MIN_AREA = 25;
const KVM_MAX_AREA = 300;
const KVM_STEP = 5;

const BUDGET_ABS_MIN = 250_000;
const BUDGET_ABS_MAX = 40_000_000;
const BUDGET_STEP = 125_000;

const ROOM_ABS_MIN = 1;
const ROOM_ABS_MAX = 5;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}

function fmtSek(n: number) {
  return `${Intl.NumberFormat("sv-SE").format(Math.round(n))}\u202fkr`;
}

function roomLbl(n: number) {
  if (n >= 5) return "5 eller flera rum";
  return `${n} rum`;
}

const labelCn =
  "mb-0.5 flex justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-subtle [&_span:last-child]:shrink-0 [&_span:last-child]:tabular-nums [&_span:last-child]:text-[13px] [&_span:last-child]:font-medium [&_span:last-child]:normal-case [&_span:last-child]:text-fg";

const selectCn =
  "mt-1 w-full rounded-md border border-rule bg-bg px-2 py-1.5 text-[14px] text-fg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-1 focus-visible:ring-offset-bg";

const inpCn =
  "mt-1 w-full rounded-md border border-rule bg-bg px-2 py-1.5 text-[14px] text-fg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-1 focus-visible:ring-offset-bg";

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
    <label className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug">
      <input
        type="checkbox"
        className="mt-0.5 accent-green"
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
    <fieldset className="rounded-md border border-rule p-3 sm:p-3.5">
      <legend className="px-1.5 font-display text-[13px] font-semibold text-fg">
        {legend}
      </legend>
      <div className="mt-2 space-y-3">{children}</div>
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

  const [roomMin, setRoomMin] = useState(2);
  const [roomMax, setRoomMax] = useState(4);

  const [kvmMin, setKvmMin] = useState(35);
  const [kvmMax, setKvmMax] = useState(95);

  const [budgetMinSEK, setBudgetMinSEK] = useState(2_750_000);
  const [budgetMaxSEK, setBudgetMaxSEK] = useState(5_500_000);

  const [timeline, setTimeline] = useState<Timeline>("nu");
  const [loanApproved, setLoanApproved] = useState(false);

  const [balcony, setBalcony] = useState(false);
  const [fireplace, setFireplace] = useState(false);
  const [elevator, setElevator] = useState(false);
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

  const setRoomMinAdj = useCallback((v: number) => {
    const next = clamp(Math.round(v), ROOM_ABS_MIN, ROOM_ABS_MAX);
    setRoomMin(next);
    setRoomMax((max) => (max < next ? next : max));
  }, []);

  const setRoomMaxAdj = useCallback((v: number) => {
    const next = clamp(Math.round(v), ROOM_ABS_MIN, ROOM_ABS_MAX);
    setRoomMax(next);
    setRoomMin((min) => (min > next ? next : min));
  }, []);

  const setKvmMinAdj = useCallback((v: number) => {
    const snapped = clamp(
      Math.round(v / KVM_STEP) * KVM_STEP,
      KVM_MIN_AREA,
      KVM_MAX_AREA,
    );
    setKvmMin(snapped);
    setKvmMax((mx) => (mx < snapped ? snapped : mx));
  }, []);

  const setKvmMaxAdj = useCallback((v: number) => {
    const snapped = clamp(
      Math.round(v / KVM_STEP) * KVM_STEP,
      KVM_MIN_AREA,
      KVM_MAX_AREA,
    );
    setKvmMax(snapped);
    setKvmMin((mn) => (mn > snapped ? snapped : mn));
  }, []);

  const setBudgetMinAdj = useCallback((v: number) => {
    const snapped = clamp(
      Math.round(v / BUDGET_STEP) * BUDGET_STEP,
      BUDGET_ABS_MIN,
      BUDGET_ABS_MAX,
    );
    setBudgetMinSEK(snapped);
    setBudgetMaxSEK((mx) => (mx < snapped ? snapped : mx));
  }, []);

  const setBudgetMaxAdj = useCallback((v: number) => {
    const snapped = clamp(
      Math.round(v / BUDGET_STEP) * BUDGET_STEP,
      BUDGET_ABS_MIN,
      BUDGET_ABS_MAX,
    );
    setBudgetMaxSEK(snapped);
    setBudgetMinSEK((mn) => (mn > snapped ? snapped : mn));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    setBusy(true);

    const payload = {
      name,
      email,
      phone,
      dwellingType,
      roomMin,
      roomMax,
      areaSqmMin: kvmMin,
      areaSqmMax: kvmMax,
      budgetMinSEK,
      budgetMaxSEK,
      timeline,
      loanApproved,
      balcony,
      fireplace,
      elevator,
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
    <div className="min-h-dvh bg-bg pb-12">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-4 pb-6 pt-5">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-green">
          Köparsignal
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-fg sm:text-4xl">
          Dra min · max på samma linje — kartan till höger
        </h1>
        <p className="mt-1.5 max-w-xl text-[13px] leading-snug text-subtle">
          Reglagen har två thumbs: vänster sida = minsta, höger sida = högsta. Bolån
          och kryss för bostaden ligger nedan.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_min(44%,460px)] lg:gap-6"
          noValidate
        >
          <div className="space-y-3.5">
            <FieldGroup legend="Kontakt">
              <div>
                <label className={labelCn}>
                  <span>Namn</span>
                  <span />
                </label>
                <input
                  className={inpCn}
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className={labelCn}>
                    <span>Mejl</span>
                    <span />
                  </label>
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
                  <label className={labelCn}>
                    <span>Telefon</span>
                    <span />
                  </label>
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

            <FieldGroup legend="Boende och siffror">
              <div>
                <label className={labelCn}>
                  <span>Typ</span>
                  <span />
                </label>
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

              <DualEndedRange
                absMax={ROOM_ABS_MAX}
                absMin={ROOM_ABS_MIN}
                ariaLabelHigh="Max antal rum"
                ariaLabelLow="Min antal rum"
                step={1}
                summary={`${roomLbl(roomMin)} till ${roomLbl(roomMax)}`}
                title="Rum"
                valueMax={roomMax}
                valueMin={roomMin}
                onHighChange={setRoomMaxAdj}
                onLowChange={setRoomMinAdj}
              />

              <DualEndedRange
                absMax={KVM_MAX_AREA}
                absMin={KVM_MIN_AREA}
                ariaLabelHigh="Största kvm"
                ariaLabelLow="Minsta kvm"
                step={KVM_STEP}
                summary={`${kvmMin}–${kvmMax}\u202fm²`}
                title="Boyta"
                valueMax={kvmMax}
                valueMin={kvmMin}
                onHighChange={setKvmMaxAdj}
                onLowChange={setKvmMinAdj}
              />

              <DualEndedRange
                absMax={BUDGET_ABS_MAX}
                absMin={BUDGET_ABS_MIN}
                ariaLabelHigh="Övre budgetgräns"
                ariaLabelLow="Nedre budgetgräns"
                step={BUDGET_STEP}
                summary={`${fmtSek(budgetMinSEK)} – ${fmtSek(budgetMaxSEK)}`}
                title="Budget"
                valueMax={budgetMaxSEK}
                valueMin={budgetMinSEK}
                onHighChange={setBudgetMaxAdj}
                onLowChange={setBudgetMinAdj}
              />

              <div>
                <label
                  htmlFor="timeline"
                  className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-subtle"
                >
                  Flytta in
                </label>
                <select
                  id="timeline"
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
            </FieldGroup>

            <FieldGroup legend="Bolån">
              <CheckboxRow
                checked={loanApproved}
                onChecked={setLoanApproved}
                label="Jag har bolånelöfte (eller väntas från bank inom kort)"
              />
              <p className="text-[11px] leading-snug text-subtle">
                Här räcker vi bara vad du själv upplever – ingen bank verifierar i
                det här skedet på knowwhatiwant.
              </p>
            </FieldGroup>

            <FieldGroup legend="Önskad bostad — checklista">
              <div className="grid gap-2 sm:grid-cols-1">
                <CheckboxRow checked={balcony} onChecked={setBalcony} label="Vill kunna ha balkong eller uteplats" />
                <CheckboxRow checked={fireplace} onChecked={setFireplace} label="Eldstad önskad (spis/kamin/öppen spis)" />
                <CheckboxRow checked={elevator} onChecked={setElevator} label="Hiss till lägenhetsplan" />
              </div>
              <div>
                <label className={labelCn}>
                  <span>Övrigt i ord — gata, hus, område</span>
                  <span />
                </label>
                <textarea
                  className={cn(inpCn, "min-h-[64px] resize-y py-2")}
                  name="areaNotes"
                  placeholder='T.ex. "vill höra om just Storgatan" eller bredare…'
                  rows={3}
                  value={areaNotes}
                  onChange={(e) => setAreaNotes(e.target.value)}
                />
              </div>
            </FieldGroup>

            {submitErr ? (
              <p className="rounded-md border border-rule bg-green-mist/50 px-2.5 py-1.5 text-[13px] text-fg dark:bg-green-soft/20">
                {submitErr}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pb-4 lg:hidden">
              <Button type="submit" disabled={busy}>
                {busy ? "Skickar…" : "Skicka köpsignal"}
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/">Avbryt</Link>
              </Button>
            </div>
          </div>

          <div className="flex min-h-[min(520px,70vh)] flex-col gap-2 lg:sticky lg:top-5 lg:self-start">
            <BuyerAreaMap onChange={onMapChange} />
            {mapGeoJson?.features?.length ? (
              <p className="text-[11px] text-green">
                {mapGeoJson.features.length === 1
                  ? "Område markerat ✓"
                  : `${mapGeoJson.features.length} markerade ytor`}
              </p>
            ) : (
              <p className="text-[11px] text-subtle">
                Kartan är valfri — rita eller hoppa över.
              </p>
            )}
            <div className="mt-auto hidden flex-wrap items-center gap-3 lg:flex lg:pb-6">
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
