"use client";

/** Två thumbs på samma bana — min vänster, max höger (två staplade `<input type="range">`). */
export function DualEndedRange(props: {
  /** Rubrik för raden över banan */
  title: string;
  /** Höger sida av rubrikraden (aktuellt intervall) */
  summary: string;
  absMin: number;
  absMax: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onLowChange: (v: number) => void;
  onHighChange: (v: number) => void;
  /** Tillgängliga etiketter + eventuellt data-testid för test */
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
    ariaLabelLow = "Minsta värde",
    ariaLabelHigh = "Högsta värde",
  } = props;

  const span = absMax - absMin || 1;
  const pct = (val: number) => ((val - absMin) / span) * 100;
  const leftPct = pct(valueMin);
  const widePct = Math.max(pct(valueMax) - leftPct, 0.35);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
          {title}
        </span>
        <span className="line-clamp-2 text-right text-[12px] font-medium leading-tight tabular-nums text-fg">
          {summary}
        </span>
      </div>

      <div className="flex items-start justify-between gap-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wide text-subtle/90">
        <span>Min</span>
        <span>Max</span>
      </div>

      <div className="dual-ended-shell relative isolate h-[2.125rem] w-full shrink-0">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-rule"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-green/85 dark:bg-green/65"
          style={{
            left: `${leftPct}%`,
            width: `${widePct}%`,
          }}
        />
        {/* Låg slider: kan gå fram till värdemax */}
        <input
          aria-label={ariaLabelLow}
          className="dual-ended-input"
          max={valueMax}
          min={absMin}
          step={step}
          type="range"
          value={valueMin}
          onInput={(e) => {
            const next = Number(e.currentTarget.value);
            if (next > valueMax) onHighChange(next);
            onLowChange(Math.min(next, valueMax));
          }}
        />
        {/* Hög slider: bakifrån min-värdet */}
        <input
          aria-label={ariaLabelHigh}
          className="dual-ended-input z-[2]"
          max={absMax}
          min={valueMin}
          step={step}
          type="range"
          value={valueMax}
          onInput={(e) => {
            const next = Number(e.currentTarget.value);
            if (next < valueMin) onLowChange(next);
            onHighChange(Math.max(next, valueMin));
          }}
        />
      </div>
    </div>
  );
}
