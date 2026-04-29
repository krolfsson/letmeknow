"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BuyerLead, Timeline } from "@/lib/buyers";
import { BuyerDistrictPicker } from "@/components/buyer/buyer-district-picker";
import { DualEndedRange } from "@/components/buyer/dual-ended-range";
import { placeringMatcharFilter } from "@/lib/location-match";
import { locationLabelsForIds, labelForPlacementId } from "@/lib/location-labels";
import { loadSwedenPlaceIndex } from "@/lib/sweden-place-index";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/cn";

const amenityLabels: Record<string, string> = {
  balcony: "Balkong / uteplats / altan",
  fireplace: "Eldstad",
  elevator: "Hiss",
};

const dwellingOptions: { value: string; label: string }[] = [
  { value: "bostadsratt", label: "Bostadsrätt" },
  { value: "radhus_kedje", label: "Radhus / kedjehus" },
  { value: "villa_parhus", label: "Villa / parhus" },
  { value: "fritid", label: "Fritidshus" },
  { value: "ovrig", label: "Övrigt" },
];

const timelineOpts: { value: Timeline; label: string }[] = [
  { value: "nu", label: "Snarast möjligt" },
  { value: "3man", label: "~3 mån" },
  { value: "6man", label: "~6 mån" },
];

const inpCn =
  "rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-[13px] text-gray-900 outline-none transition-all duration-200 focus-visible:border-emerald-500/45 focus-visible:ring-4 focus-visible:ring-emerald-400/15";

/** Samma mått och steg som i köparsidans formulär (`buyer-form`). */
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

/** Samma sek-formatering och rumstexter som i köparsidans formulär. */
function fmtSekDual(n: number) {
  return `${Intl.NumberFormat("sv-SE").format(Math.round(n))}\u202fkr`;
}

function roomLbl(n: number) {
  if (n >= 5) return "5 eller flera rum";
  return `${n} rum`;
}

function dwellingLabel(v: string) {
  return dwellingOptions.find((o) => o.value === v)?.label ?? v;
}

function timelinesLabel(tl: Timeline) {
  return timelineOpts.find((o) => o.value === tl)?.label ?? tl;
}

function amenityList(ids: BuyerLead["amenityIds"]) {
  if (!ids.length) return "Ej angivet";
  return ids.map((id) => amenityLabels[id] ?? id).join(", ");
}

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("sv-SE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

function fmtDateShort(iso: string) {
  try {
    return new Intl.DateTimeFormat("sv-SE", { dateStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

/** Kompakt budget för listrad (fungerar även under 1 Mkr). */
function fmtBudgetCompact(lo: number, hi: number) {
  const fmt = (n: number) =>
    Intl.NumberFormat("sv-SE", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(n);
  return `${fmt(lo)}–${fmt(hi)}\u202fkr`;
}

function dwellAbbr(v: string) {
  const m: Record<string, string> = {
    bostadsratt: "BR",
    radhus_kedje: "RH",
    villa_parhus: "VH",
    fritid: "Fri",
    ovrig: "Övr",
  };
  return m[v] ?? v.slice(0, 3);
}

function timelineAbbr(tl: Timeline) {
  if (tl === "nu") return "Nu";
  if (tl === "3man") return "3 m";
  return "6 m";
}

function areasPreview(
  ids: string[],
  labelById: ReadonlyMap<string, string>,
  max = 2,
) {
  const names = locationLabelsForIds(ids, labelById);
  if (!names.length) return "–";
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")} +${names.length - max}`;
}

/** Intervall [a,b] och [c,d] överlappar (heltal för rum kvm). */
function rangesOverlap(
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number,
): boolean {
  return Math.max(aLo, bLo) <= Math.min(aHi, bHi);
}

function FilterFieldGroup({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-gray-100 bg-white/55 p-4 sm:p-5">
      <legend className="px-1.5 text-[13px] font-semibold text-gray-900">
        {legend}
      </legend>
      <div className="mt-2 space-y-3">{children}</div>
    </fieldset>
  );
}

export function AgentLeadsDashboard() {
  const [rows, setRows] = useState<BuyerLead[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [timelinePick, setTimelinePick] = useState<Timeline[]>([]);
  const [dwellPick, setDwellPick] = useState<string[]>([]);
  const [loanPick, setLoanPick] = useState<"all" | "yes" | "no">("all");
  const [districtPick, setDistrictPick] = useState<string[]>([]);

  const [geoLabelLookup, setGeoLabelLookup] =
    useState<ReadonlyMap<string, string> | null>(null);
  const [kkByGeoForFilter, setKkByGeoForFilter] = useState<Map<
    string,
    string
  > | null>(null);

  useEffect(() => {
    loadSwedenPlaceIndex()
      .then(({ labelById, kkByGeoId }) => {
        setGeoLabelLookup(labelById);
        setKkByGeoForFilter(kkByGeoId);
      })
      .catch(() => {});
  }, []);

  const placementLabels = geoLabelLookup ?? new Map<string, string>();

  const [filtRoomMin, setFiltRoomMin] = useState(ROOM_ABS_MIN);
  const [filtRoomMax, setFiltRoomMax] = useState(ROOM_ABS_MAX);
  const [filtKvmMin, setFiltKvmMin] = useState(KVM_MIN_AREA);
  const [filtKvmMax, setFiltKvmMax] = useState(KVM_MAX_AREA);
  const [filtBudgetMinSEK, setFiltBudgetMinSEK] = useState(BUDGET_ABS_MIN);
  const [filtBudgetMaxSEK, setFiltBudgetMaxSEK] = useState(BUDGET_ABS_MAX);

  const setFiltRoomMinAdj = useCallback((v: number) => {
    const next = clamp(Math.round(v), ROOM_ABS_MIN, ROOM_ABS_MAX);
    setFiltRoomMin(next);
    setFiltRoomMax((max) => (max < next ? next : max));
  }, []);

  const setFiltRoomMaxAdj = useCallback((v: number) => {
    const next = clamp(Math.round(v), ROOM_ABS_MIN, ROOM_ABS_MAX);
    setFiltRoomMax(next);
    setFiltRoomMin((min) => (min > next ? next : min));
  }, []);

  const setFiltKvmMinAdj = useCallback((v: number) => {
    const snapped = clamp(
      Math.round(v / KVM_STEP) * KVM_STEP,
      KVM_MIN_AREA,
      KVM_MAX_AREA,
    );
    setFiltKvmMin(snapped);
    setFiltKvmMax((mx) => (mx < snapped ? snapped : mx));
  }, []);

  const setFiltKvmMaxAdj = useCallback((v: number) => {
    const snapped = clamp(
      Math.round(v / KVM_STEP) * KVM_STEP,
      KVM_MIN_AREA,
      KVM_MAX_AREA,
    );
    setFiltKvmMax(snapped);
    setFiltKvmMin((mn) => (mn > snapped ? snapped : mn));
  }, []);

  const setFiltBudgetMinAdj = useCallback((v: number) => {
    const snapped = clamp(
      Math.round(v / BUDGET_STEP) * BUDGET_STEP,
      BUDGET_ABS_MIN,
      BUDGET_ABS_MAX,
    );
    setFiltBudgetMinSEK(snapped);
    setFiltBudgetMaxSEK((mx) => (mx < snapped ? snapped : mx));
  }, []);

  const setFiltBudgetMaxAdj = useCallback((v: number) => {
    const snapped = clamp(
      Math.round(v / BUDGET_STEP) * BUDGET_STEP,
      BUDGET_ABS_MIN,
      BUDGET_ABS_MAX,
    );
    setFiltBudgetMaxSEK(snapped);
    setFiltBudgetMinSEK((mn) => (mn > snapped ? snapped : mn));
  }, []);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/buyers", { cache: "no-store" });
      if (!res.ok) throw new Error("Kunde inte hämta listan.");
      const data = (await res.json()) as BuyerLead[];
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setErr("Kunde inte hämta köparsignaler. Är backend igång?");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => reload());
  }, [reload]);

  const filtered = useMemo(() => {
    if (!rows?.length) return [];
    let list = [...rows];

    const q = search.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    if (q.length) {
      list = list.filter((r) => {
        const hay = `${r.name} ${r.email} ${r.phone}`.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
        return hay.includes(q);
      });
    }

    if (timelinePick.length) {
      list = list.filter((r) => timelinePick.includes(r.timeline));
    }

    if (dwellPick.length) {
      list = list.filter((r) => dwellPick.includes(r.dwellingType));
    }

    if (loanPick === "yes") list = list.filter((r) => r.loanApproved);
    if (loanPick === "no") list = list.filter((r) => !r.loanApproved);

    if (districtPick.length) {
      const kk = kkByGeoForFilter ?? new Map<string, string>();
      list = list.filter((r) =>
        r.districtIds.some((buyerPid) =>
          districtPick.some((filtPid) =>
            placeringMatcharFilter(buyerPid, filtPid, kk),
          ),
        ),
      );
    }

    list = list.filter((r) =>
      rangesOverlap(r.roomMin, r.roomMax, filtRoomMin, filtRoomMax),
    );

    list = list.filter((r) =>
      rangesOverlap(
        filtBudgetMinSEK,
        filtBudgetMaxSEK,
        r.budgetMinSEK,
        r.budgetMaxSEK,
      ),
    );

    list = list.filter((r) => {
      if (r.areaSqmMin === null || r.areaSqmMax === null) return false;
      return rangesOverlap(
        r.areaSqmMin,
        r.areaSqmMax,
        filtKvmMin,
        filtKvmMax,
      );
    });

    return list;
  }, [
    rows,
    search,
    timelinePick,
    dwellPick,
    loanPick,
    districtPick,
    filtRoomMin,
    filtRoomMax,
    filtBudgetMinSEK,
    filtBudgetMaxSEK,
    filtKvmMin,
    filtKvmMax,
    kkByGeoForFilter,
  ]);

  function clearFilters() {
    setSearch("");
    setTimelinePick([]);
    setDwellPick([]);
    setLoanPick("all");
    setDistrictPick([]);
    setFiltRoomMin(ROOM_ABS_MIN);
    setFiltRoomMax(ROOM_ABS_MAX);
    setFiltKvmMin(KVM_MIN_AREA);
    setFiltKvmMax(KVM_MAX_AREA);
    setFiltBudgetMinSEK(BUDGET_ABS_MIN);
    setFiltBudgetMaxSEK(BUDGET_ABS_MAX);
  }

  function toggleIn<T extends string>(arr: T[], val: T, set: (a: T[]) => void) {
    if (arr.includes(val)) set(arr.filter((x) => x !== val));
    else set([...arr, val]);
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-white to-green-50/40 pb-16">
      <SiteHeader />

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center">
          <div className="h-[300px] w-[640px] rounded-full bg-emerald-400/15 opacity-40 blur-3xl" />
        </div>

        <div className="relative mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Mäklare
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 md:text-5xl">
            Köparsignaler
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
            Hitta riktiga köpare utifrån område, budget, timing och bostadstyp.
            Öppna en rad när något ser relevant ut.
          </p>
        </div>

        <section className="relative mb-10 rounded-2xl border border-white/40 bg-white/80 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.06)] ring-1 ring-white/50 backdrop-blur-md sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Filter</h2>
            <button
              type="button"
              className="text-[12px] font-medium text-gray-500 underline underline-offset-2 transition-colors hover:text-indigo-600"
              onClick={clearFilters}
            >
              Rensa alla filter
            </button>
          </div>

          <div className="mx-auto max-w-4xl space-y-3.5">
            <FilterFieldGroup legend="Kontakt (sök bland köparsignaler)">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Fritext namn · mejl · telefon
                </span>
                <input
                  className={cn(inpCn, "w-full")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Till exempel Exempelsson eller 070…"
                />
              </label>
            </FilterFieldGroup>

            <FilterFieldGroup legend="Geografi">
              <BuyerDistrictPicker value={districtPick} onChange={setDistrictPick} />
            </FilterFieldGroup>

            <FilterFieldGroup legend="Bostadstyp">
              <p className="text-[12px] text-gray-500">
                Lämna avmarkerat för alla typer, eller kryssa vad du vill matcha mot.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dwellingOptions.map((o) => {
                  const on = dwellPick.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() =>
                        toggleIn(dwellPick, o.value, setDwellPick)
                      }
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                        on
                          ? "border-emerald-500/25 bg-green-50 text-emerald-950"
                          : "border-gray-200 bg-white/70 text-gray-700 hover:border-emerald-500/30 hover:bg-white",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </FilterFieldGroup>

            <FilterFieldGroup legend="Boende och siffror">
              <p className="text-[12px] leading-snug text-gray-500">
                Samma områdessök och reglage som för{" "}
                <span className="font-medium text-gray-900">
                  köparsignalen (/buyer)
                </span>
                . Köpare visas om deras önskade intervall&nbsp;
                <span className="font-medium text-gray-900">överlappar</span> med
                dina filter.
              </p>
              <DualEndedRange
                absMax={ROOM_ABS_MAX}
                absMin={ROOM_ABS_MIN}
                ariaLabelHigh="Högsta rum i filtret"
                ariaLabelLow="Minsta rum i filtret"
                step={1}
                summary={`${roomLbl(filtRoomMin)} till ${roomLbl(filtRoomMax)}`}
                title="Rum"
                valueMax={filtRoomMax}
                valueMin={filtRoomMin}
                onHighChange={setFiltRoomMaxAdj}
                onLowChange={setFiltRoomMinAdj}
              />
              <DualEndedRange
                absMax={KVM_MAX_AREA}
                absMin={KVM_MIN_AREA}
                ariaLabelHigh="Högsta kvm i filtret"
                ariaLabelLow="Minsta kvm i filtret"
                step={KVM_STEP}
                summary={`${filtKvmMin}–${filtKvmMax}\u202fm²`}
                title="Boyta"
                valueMax={filtKvmMax}
                valueMin={filtKvmMin}
                onHighChange={setFiltKvmMaxAdj}
                onLowChange={setFiltKvmMinAdj}
              />
              <DualEndedRange
                absMax={BUDGET_ABS_MAX}
                absMin={BUDGET_ABS_MIN}
                ariaLabelHigh="Övre budget i filtret"
                ariaLabelLow="Nedre budget i filtret"
                step={BUDGET_STEP}
                summary={`${fmtSekDual(filtBudgetMinSEK)} – ${fmtSekDual(filtBudgetMaxSEK)}`}
                title="Budget"
                valueMax={filtBudgetMaxSEK}
                valueMin={filtBudgetMinSEK}
                onHighChange={setFiltBudgetMaxAdj}
                onLowChange={setFiltBudgetMinAdj}
              />
            </FilterFieldGroup>

            <FilterFieldGroup legend="Flytta in och bolån">
              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Flytta in
                </span>
                <div className="flex flex-wrap gap-2">
                  {timelineOpts.map(({ value, label }) => {
                    const on = timelinePick.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          toggleIn(timelinePick, value, setTimelinePick)
                        }
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                          on
                            ? "border-emerald-500/25 bg-green-50 text-emerald-950"
                            : "border-gray-200 bg-white/70 text-gray-700 hover:border-emerald-500/30 hover:bg-white",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Bolånelöfte
                </span>
                <select
                  className={cn(inpCn, "w-full max-w-md")}
                  value={loanPick}
                  onChange={(e) =>
                    setLoanPick(e.target.value as "all" | "yes" | "no")
                  }
                >
                  <option value="all">Alla köpsignaler</option>
                  <option value="yes">Har bolånelöfte (eller väntas)</option>
                  <option value="no">Ej angivet</option>
                </select>
              </div>
            </FilterFieldGroup>
          </div>
        </section>

        {loading ? (
          <p className="animate-pulse py-16 text-center text-[14px] text-gray-500">
            Läser köpsignaler…
          </p>
        ) : err ? (
          <p className="rounded-xl border border-emerald-500/20 bg-green-50/90 px-4 py-3 text-[14px] text-gray-900">
            {err}
          </p>
        ) : null}

        {!loading && !err && rows ? (
          <p className="mb-4 text-[13px] text-gray-600">
            Visar <strong className="text-gray-900">{filtered.length}</strong> av{" "}
            <strong className="text-gray-900">{rows.length}</strong> köpsignal
            {rows.length !== 1 ? "er" : ""}.
          </p>
        ) : null}

        <ul className="relative divide-y divide-gray-100 overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.05)] ring-1 ring-white/50 backdrop-blur-md">
          {!loading &&
            !err &&
            filtered.map((lead) => {
              const open = expandedId === lead.id;
              const namesLine = locationLabelsForIds(
                lead.districtIds,
                placementLabels,
              ).join(", ");
              const metrics = [
                dwellAbbr(lead.dwellingType),
                `${lead.roomMin}–${lead.roomMax} r`,
                `${lead.areaSqmMin}–${lead.areaSqmMax} kvm`,
                fmtBudgetCompact(lead.budgetMinSEK, lead.budgetMaxSEK),
                timelineAbbr(lead.timeline),
                lead.loanApproved ? "Lån ✓" : null,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <li key={lead.id} className="bg-white/35">
                  <button
                    type="button"
                    aria-expanded={open}
                    className="flex w-full items-start gap-2 px-3 py-3 text-left transition-colors hover:bg-green-50/70 sm:items-center sm:gap-3 sm:px-4"
                    onClick={() =>
                      setExpandedId((prev) =>
                        prev === lead.id ? null : lead.id,
                      )
                    }
                  >
                    <span
                      className="mt-0.5 shrink-0 font-mono text-[11px] text-gray-400 sm:mt-0"
                      aria-hidden
                    >
                      {open ? "▼" : "▶"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                        <span className="truncate text-[13px] font-semibold text-gray-900">
                          {lead.name}
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-gray-500">
                          {fmtDateShort(lead.createdAt)}
                        </span>
                      </div>
                      <p className="truncate text-[11px] leading-tight text-gray-600">
                        {metrics}
                      </p>
                      <p className="truncate text-[11px] leading-tight text-gray-500">
                        {areasPreview(lead.districtIds, placementLabels)}
                      </p>
                    </div>
                  </button>

                  {open ? (
                    <div className="border-t border-gray-100 bg-green-50/50 px-3 py-3 sm:pl-9">
                      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                        <a
                          href={`mailto:${lead.email}`}
                          className="font-medium text-emerald-600 underline-offset-2 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.email}
                        </a>
                        <a
                          href={`tel:${lead.phone.replace(/\s/g, "")}`}
                          className="font-medium text-emerald-600 underline-offset-2 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.phone}
                        </a>
                        <span className="text-gray-500">
                          Inlämnad {fmtDate(lead.createdAt)}
                        </span>
                      </div>
                      <p className="mb-3 text-[12px] leading-snug">
                        <span className="font-semibold text-gray-500">
                          Önskade områden:{" "}
                        </span>
                        {namesLine || "–"}
                      </p>
                      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Alla fält
                      </h3>
                      <dl className="grid gap-1.5 text-[11px] sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded border border-gray-100 bg-white/65 p-2 ">
                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                            ID
                          </dt>
                          <dd className="mt-0.5 break-all font-mono text-[10px]">
                            {lead.id}
                          </dd>
                        </div>
                        <div className="rounded border border-gray-100 bg-white/65 p-2 ">
                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                            Bostadstyp
                          </dt>
                          <dd className="mt-0.5">{dwellingLabel(lead.dwellingType)}</dd>
                        </div>
                        <div className="rounded border border-gray-100 bg-white/65 p-2 ">
                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                            Flytta in
                          </dt>
                          <dd className="mt-0.5">
                            {timelinesLabel(lead.timeline)}
                          </dd>
                        </div>
                        <div className="rounded border border-gray-100 bg-white/65 p-2 ">
                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                            Rum
                          </dt>
                          <dd className="mt-0.5">
                            {lead.roomMin}–{lead.roomMax} rum
                          </dd>
                        </div>
                        <div className="rounded border border-gray-100 bg-white/65 p-2 ">
                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                            Boyta
                          </dt>
                          <dd className="mt-0.5">
                            {lead.areaSqmMin}–{lead.areaSqmMax} m²
                          </dd>
                        </div>
                        <div className="rounded border border-gray-100 bg-white/65 p-2 ">
                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                            Budget
                          </dt>
                          <dd className="mt-0.5 tabular-nums leading-snug">
                            {fmtSekDual(lead.budgetMinSEK)} –{" "}
                            {fmtSekDual(lead.budgetMaxSEK)}
                          </dd>
                        </div>
                        <div className="rounded border border-gray-100 bg-white/65 p-2 sm:col-span-2 lg:col-span-3 ">
                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                            Område (id + namn)
                          </dt>
                          <dd className="mt-0.5">
                            <ul className="list-disc space-y-0.5 pl-4">
                              {lead.districtIds.map((id, i) => (
                                <li key={`${lead.id}-${id}-${i}`}>
                                  <code className="text-[10px]">{id}</code> —{" "}
                                  {labelForPlacementId(id, placementLabels)}
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                        <div className="rounded border border-gray-100 bg-white/65 p-2 sm:col-span-2 lg:col-span-3 ">
                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                            Checklista
                          </dt>
                          <dd className="mt-0.5">{amenityList(lead.amenityIds)}</dd>
                        </div>
                        <div className="rounded border border-gray-100 bg-white/65 p-2 sm:col-span-2 lg:col-span-3 ">
                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                            Bolånelöfte
                          </dt>
                          <dd className="mt-0.5">
                            {lead.loanApproved ? "Ja (enligt köpare)" : "Ej angivet"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                </li>
              );
            })}
        </ul>

        {!loading && !err && filtered.length === 0 ? (
          <p className="py-14 text-center text-[14px] text-gray-500">
            Inga köpsignal matchade filtren — prova bredare kriterier.
          </p>
        ) : null}
      </div>
    </div>
  );
}
