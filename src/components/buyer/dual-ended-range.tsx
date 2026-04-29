"use client";

import { useState } from "react";

/** Två thumbs på **samma** numeriska span [absMin, absMax]; annars ritas tumnaglarna vid olika kartskalor och allt flyter ihop fel. */
export function DualEndedRange(props: {
  title: string;
  summary: string;
  absMin: number;
  absMax: number;
  step: number | string;
  valueMin: number;
  valueMax: number;
  onLowChange: (v: number) => void;
  onHighChange: (v: number) => void;
  ariaLabelLow?: string;
  ariaLabelHigh?: string;
}) {
  const {
    title,
    summary,
    absMin,
    absMax,
    step,
    valueMin,
    valueMax,
    onLowChange,
    onHighChange,
    ariaLabelLow = "Lägsta värde på skalan",
    ariaLabelHigh = "Högsta värde på skalan",
  } = props;

  /** vilken slider som är över när händer möts vid dra/pek */
  const [topThumb, setTopThumb] = useState<"low" | "high">("high");

  const span = absMax - absMin || 1;
  const pct = (val: number) => ((Math.min(Math.max(val, absMin), absMax) - absMin) / span) * 100;
  const leftPct = pct(valueMin);
  const stepNum = typeof step === "number" ? step : Number.parseFloat(String(step));
  const tol =
    Number.isFinite(stepNum) && stepNum > 0 ? stepNum * 0.501 : 1e-9;
  const same = Math.abs(valueMin - valueMax) < tol + Number.EPSILON;
  /** När min=max: ingen dekor-fill — min-bredd i % hamnar bredvid tumnaglens centrum och ser buggy ut bakom pricken */
  const widePct = Math.max(pct(valueMax) - leftPct, 0.35);

  const zLow = topThumb === "low" ? 5 : 2;
  const zHigh = topThumb === "high" ? 5 : 2;

  return (
    <div className="-my-1">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </span>
        <span className="line-clamp-2 text-right text-[12px] font-medium leading-tight tabular-nums text-gray-900">
          {summary}
        </span>
      </div>

      <div className="dual-ended-shell relative isolate h-[2.25rem] w-full shrink-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-[10px] -translate-y-1/2 rounded-full bg-gray-200/80"
        />
        {!same && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 h-[10px] min-w-[4px] -translate-y-1/2 rounded-full bg-emerald-500/90"
            style={{
              left: `${leftPct}%`,
              width: `${widePct}%`,
            }}
          />
        )}
        <input
          aria-label={ariaLabelLow}
          className="dual-ended-input"
          style={{ zIndex: zLow }}
          type="range"
          min={absMin}
          max={absMax}
          step={step}
          value={valueMin}
          onPointerDown={() => setTopThumb("low")}
          onInput={(e) => {
            const v = Number(e.currentTarget.value);
            onLowChange(v);
          }}
        />
        <input
          aria-label={ariaLabelHigh}
          className="dual-ended-input"
          style={{ zIndex: zHigh }}
          type="range"
          min={absMin}
          max={absMax}
          step={step}
          value={valueMax}
          onPointerDown={() => setTopThumb("high")}
          onInput={(e) => {
            const v = Number(e.currentTarget.value);
            onHighChange(v);
          }}
        />
      </div>
    </div>
  );
}
