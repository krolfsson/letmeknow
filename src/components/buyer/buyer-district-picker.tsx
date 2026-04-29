"use client";

import { useMemo, useState } from "react";
import {
  STOCKHOLM_AREAS,
  normalizeForSearch,
  type StockholmAreaTier,
} from "@/lib/stockholm-stadsdelar";
import { cn } from "@/lib/cn";

const inpCn =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-[14px] text-gray-900 outline-none transition-all duration-200 focus-visible:border-emerald-500/45 focus-visible:ring-4 focus-visible:ring-emerald-400/15";

function tierLabel(tier: StockholmAreaTier) {
  return tier === "stadsdel" ? "Stadsdel" : "Område";
}

export function BuyerDistrictPicker(props: {
  value: string[];
  onChange: (ids: string[]) => void;
  /** Köparform kräver val; mäklarvyn kan visa alla utan geografiskt filter. */
  purpose?: "buyerSubmission" | "agentFilter";
}) {
  const { value, onChange, purpose = "buyerSubmission" } = props;
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(query.trim());
    if (!q) return [...STOCKHOLM_AREAS];
    return STOCKHOLM_AREAS.filter((d) =>
      normalizeForSearch(d.name).includes(q),
    );
  }, [query]);

  function toggle(id: string) {
    const next = new Set(value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(
      [...next].sort((a, b) => {
        const na = STOCKHOLM_AREAS.find((x) => x.id === a)?.name ?? a;
        const nb = STOCKHOLM_AREAS.find((x) => x.id === b)?.name ?? b;
        return na.localeCompare(nb, "sv");
      }),
    );
  }

  function remove(id: string) {
    onChange(value.filter((x) => x !== id));
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] leading-snug text-gray-600">
        Officiella{" "}
        <span className="font-medium text-gray-900">stadsdelar</span> och vanliga
        områdesnamn, t.ex. Hornstull, Maria och Högalid — välj vad som matchar
        vad du ändå skulle säga muntligt.
      </p>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Sök stadsdel eller område
        </span>
        <input
          className={inpCn}
          type="search"
          inputMode="search"
          placeholder="Till exempel hornstull, högalid, vasastan…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </label>

      {value.length ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const row = STOCKHOLM_AREAS.find((d) => d.id === id);
            const label = row?.name ?? id;
            return (
              <button
                key={id}
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-green-50 px-2.5 py-0.5 text-[12px] font-medium text-gray-900",
                )}
                onClick={() => remove(id)}
              >
                {label}
                {row ? (
                  <span className="text-[10px] font-normal uppercase tracking-wide text-gray-500">
                    {tierLabel(row.tier)}
                  </span>
                ) : null}
                <span className="text-gray-500" aria-hidden>
                  ×
                </span>
                <span className="sr-only">Ta bort {label}</span>
              </button>
            );
          })}
        </div>
      ) : purpose === "agentFilter" ? (
        <p className="text-[12px] text-gray-600">
          Ingen geografisk begränsning — kryssa i för att bara visa köpare som
          valt ett eller flera av dessa områden.
        </p>
      ) : (
        <p className="text-[12px] text-gray-600">
          Välj minst ett område — stadsdel eller lokalt område.
        </p>
      )}

      <div
        className="max-h-[min(40vh,240px)] overflow-y-auto rounded-xl border border-gray-100 bg-white/70 p-1.5"
        aria-label="Stadsdelar och områden i Stockholm stad"
      >
        <ul className="grid gap-0.5">
          {filtered.map((d) => {
            const on = selectedSet.has(d.id);
            return (
              <li key={d.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] leading-snug text-gray-800 hover:bg-green-50/70",
                    on && "bg-green-50",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-emerald-500"
                    checked={on}
                    onChange={() => toggle(d.id)}
                  />
                  <span className="flex min-w-0 flex-1 justify-between gap-2">
                    <span>{d.name}</span>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      {tierLabel(d.tier)}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-center text-[13px] text-gray-500">
            Inga träffar — prova ett annat sökord.
          </p>
        ) : null}
      </div>
    </div>
  );
}
