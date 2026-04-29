"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { BuyerDistrictPicker } from "@/components/buyer/buyer-district-picker";
import { DualEndedRange } from "@/components/buyer/dual-ended-range";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import type { AmenityId, Timeline } from "@/lib/buyers";

const dwellingOptions = [
  { value: "bostadsratt", label: "Bostadsrätt" },
  { value: "radhus_kedje", label: "Radhus / kedjehus" },
  { value: "villa_parhus", label: "Villa / parhus" },
  { value: "fritid", label: "Fritidshus" },
  { value: "ovrig", label: "Övrigt" },
];

const amenityOptions: { value: AmenityId; label: string }[] = [
  { value: "balcony", label: "Balkong / uteplats / altan" },
  { value: "fireplace", label: "Eldstad" },
  { value: "elevator", label: "Hiss" },
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
  "mb-1 flex justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 [&_span:last-child]:shrink-0 [&_span:last-child]:tabular-nums [&_span:last-child]:text-[13px] [&_span:last-child]:font-medium [&_span:last-child]:normal-case [&_span:last-child]:text-gray-900";

const selectCn =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-[14px] text-gray-900 outline-none transition-all duration-200 focus-visible:border-emerald-500/45 focus-visible:ring-4 focus-visible:ring-emerald-400/15";

const inpCn =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-[14px] text-gray-900 outline-none transition-all duration-200 focus-visible:border-emerald-500/45 focus-visible:ring-4 focus-visible:ring-emerald-400/15";

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
    <label className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-gray-700">
      <input
        type="checkbox"
        className="mt-0.5 accent-emerald-500"
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
    <fieldset className="rounded-2xl border border-gray-100 bg-white/55 p-4 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] sm:p-5">
      <legend className="px-1.5 text-[13px] font-semibold text-gray-900">
        {legend}
      </legend>
      <div className="mt-2 space-y-3">{children}</div>
    </fieldset>
  );
}

export default function BuyerForm() {
  const router = useRouter();

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
  const [amenityIds, setAmenityIds] = useState<AmenityId[]>([]);
  const [loanApproved, setLoanApproved] = useState(false);

  const [districtIds, setDistrictIds] = useState<string[]>([]);

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

  const toggleAmenity = useCallback((id: AmenityId, checked: boolean) => {
    setAmenityIds((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id),
    );
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);

    if (districtIds.length === 0) {
      setSubmitErr("Välj minst ett område, en stad eller ett samhälle.");
      return;
    }

    setBusy(true);

    const payload = {
      name,
      email,
      phone,
      dwellingType,
      districtIds,
      roomMin,
      roomMax,
      areaSqmMin: kvmMin,
      areaSqmMax: kvmMax,
      budgetMinSEK,
      budgetMaxSEK,
      timeline,
      amenityIds,
      loanApproved,
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
    <div className="min-h-dvh bg-gradient-to-b from-white to-green-50/40 pb-16">
      <SiteHeader />

      <div className="relative mx-auto max-w-4xl px-4 pb-6 pt-10">
        <div className="pointer-events-none absolute inset-x-0 top-14 flex justify-center">
          <div className="h-[260px] w-[560px] rounded-full bg-emerald-400/15 opacity-40 blur-3xl" />
        </div>

        <div className="relative mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Köpare
          </p>
          <h1 className="mx-auto mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-gray-900 md:text-5xl">
            Berätta hur du vill bo
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
            Skriv in områden, ramar och kontaktuppgifter. När en mäklare har något
            som matchar kan de hitta dig.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative mx-auto max-w-2xl space-y-4 rounded-2xl border border-white/40 bg-white/80 px-4 py-5 shadow-[0_10px_40px_rgba(0,0,0,0.06)] ring-1 ring-white/50 backdrop-blur-md sm:px-6 sm:py-6"
          noValidate
        >
          <FieldGroup legend="Var vill du bo">
            <BuyerDistrictPicker value={districtIds} onChange={setDistrictIds} />
          </FieldGroup>

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
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500"
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

          <FieldGroup legend="Checklista">
            {amenityOptions.map((option) => (
              <CheckboxRow
                key={option.value}
                checked={amenityIds.includes(option.value)}
                onChecked={(checked) => toggleAmenity(option.value, checked)}
                label={option.label}
              />
            ))}
          </FieldGroup>

          <FieldGroup legend="Bolån">
              <CheckboxRow
                checked={loanApproved}
                onChecked={setLoanApproved}
                label="Jag har bolånelöfte (vi kommer inte dubbelkolla, men vill mest veta hur långt fram i processen du är)"
              />
          </FieldGroup>

          {submitErr ? (
            <p className="rounded-xl border border-emerald-500/20 bg-green-50/90 px-3 py-2 text-[13px] text-gray-900">
              {submitErr}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pb-4">
            <Button type="submit" disabled={busy}>
              {busy ? "Skickar…" : "Skicka köpsignal"}
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/">Avbryt</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
