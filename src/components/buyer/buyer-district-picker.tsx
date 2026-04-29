"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  STOCKHOLM_AREAS,
  normalizeForSearch,
  type StockholmAreaTier,
  STOCKHOLM_KOMMUNKOD,
} from "@/lib/stockholm-stadsdelar";
import type { SwedenPlaceRow } from "@/lib/sweden-place-index";
import { loadSwedenPlaceIndex } from "@/lib/sweden-place-index";
import { cn } from "@/lib/cn";

const inpCn =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-[14px] text-gray-900 outline-none transition-all duration-200 focus-visible:border-emerald-500/45 focus-visible:ring-4 focus-visible:ring-emerald-400/15";

function tierLabelStockholm(tier: StockholmAreaTier) {
  return tier === "stadsdel" ? "Stadsdel" : "Område";
}

function mergeRows(nationalRows: SwedenPlaceRow[]): SwedenPlaceRow[] {
  const sthlmMapped: SwedenPlaceRow[] = STOCKHOLM_AREAS.map((d) => ({
    id: d.id,
    label: d.name,
    kind: d.tier === "stadsdel" ? "stockholm-stadsdel" : "stockholm-lokal",
    sub:
      d.tier === "stadsdel"
        ? "Stockholm · stadsdel"
        : `Stockholm · ${tierLabelStockholm(d.tier).toLowerCase()}`,
    kk: STOCKHOLM_KOMMUNKOD,
  }));

  /** Stockholmsk listan först (relevans), sedan resten av landet utan dublett-id. */
  const seenId = new Set(sthlmMapped.map((r) => r.id));
  const rest = nationalRows.filter((r) => !seenId.has(r.id));
  return [...sthlmMapped, ...rest];
}

function scoreRow(normQ: string, label: string, sub?: string): number {
  const nl = normalizeForSearch(label);
  const ns = sub ? normalizeForSearch(sub) : "";
  if (nl.startsWith(normQ) || nl === normQ) return 0;
  if (nl.includes(normQ)) return 50;
  if (ns.includes(normQ)) return 120;
  return 999;
}

export function BuyerLocationPicker(props: {
  value: string[];
  onChange: (ids: string[]) => void;
  purpose?: "buyerSubmission" | "agentFilter";
}) {
  const { value, onChange, purpose = "buyerSubmission" } = props;
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [nationalRows, setNationalRows] = useState<SwedenPlaceRow[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  useEffect(() => {
    loadSwedenPlaceIndex()
      .then((d) => setNationalRows(d.rows))
      .catch(() => setLoadErr("Kunde inte ladda geografidata."));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 160);
    return () => clearTimeout(t);
  }, [query]);

  const corpus = useMemo(
    () =>
      mergeRows(typeof nationalRows === "object" && nationalRows?.length ? nationalRows : []),
    [nationalRows],
  );

  const idToRow = useMemo(() => new Map(corpus.map((r) => [r.id, r])), [corpus]);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(debouncedQuery);
    if (!q) {
      /** Poppar största orter högst utan stor pop i JSON — prioriterade prefix */
      const head = corpus.slice(0, 120);
      return [...head].sort((a, b) =>
        a.label.localeCompare(b.label, "sv"),
      );
    }

    type Scored = SwedenPlaceRow & { _score: number };
    const ranked: Scored[] = [];
    const maxOut = 80;
    for (const row of corpus) {
      const s = scoreRow(q, row.label, row.sub);
      if (s >= 998) continue;
      ranked.push({ ...row, _score: s });
    }
    ranked.sort((x, y) => {
      if (x._score !== y._score) return x._score - y._score;
      return x.label.localeCompare(y.label, "sv");
    });
    return ranked.slice(0, maxOut).map((row) => {
      const stripped: SwedenPlaceRow = {
        id: row.id,
        label: row.label,
        kind: row.kind,
        ...(row.sub !== undefined ? { sub: row.sub } : {}),
        ...(row.kk !== undefined ? { kk: row.kk } : {}),
      };
      return stripped;
    });
  }, [debouncedQuery, corpus]);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const sortSelectedIds = useCallback(
    (ids: string[]) =>
      [...ids].sort((a, b) =>
        (idToRow.get(a)?.label ?? a).localeCompare(idToRow.get(b)?.label ?? b, "sv"),
      ),
    [idToRow],
  );

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(value);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onChange(sortSelectedIds([...next]));
    },
    [onChange, value, sortSelectedIds],
  );

  const remove = useCallback(
    (id: string) => {
      onChange(value.filter((x) => x !== id));
    },
    [onChange, value],
  );

  function kindBadge(kind: string) {
    if (kind === "stockholm-stadsdel") return tierLabelStockholm("stadsdel");
    if (kind === "stockholm-lokal") return tierLabelStockholm("lokalt");
    if (kind === "stad") return "Stad/tätort";
    if (kind === "ort") return "Ort";
    if (kind === "kommun") return "Kommun";
    return "Plats";
  }

  const busy = nationalRows === null && !loadErr;

  return (
    <div className="space-y-3">
      <p className="text-[12px] leading-snug text-gray-600">
        Sök stad, tätort, kommun eller område i Stockholm stad — på samma sätt som på stor
        bostadssökning på nätet: skriv t.ex.&nbsp;<span className="font-medium text-gray-900">
          Stockholm</span>,&nbsp;<span className="font-medium text-gray-900">Örebro</span>{" "}
        eller ett mindre&nbsp;
        <span className="font-medium text-gray-900">samhällesnamn</span>.
      </p>
      {loadErr ? (
        <p className="text-[12px] text-red-700">{loadErr}</p>
      ) : null}

      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Sök plats
        </span>
        <input
          className={inpCn}
          type="search"
          inputMode="search"
          placeholder="Till exempel stockholm, grums, lund, kommunnamn …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          aria-busy={busy}
          disabled={busy}
        />
      </label>

      {value.length ? (
        <div className="flex flex-wrap gap-1.5">
          {sortSelectedIds(value).map((id) => {
            const row = idToRow.get(id);
            const lbl = row?.label ?? id;
            return (
              <button
                key={id}
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-green-50 px-2.5 py-0.5 text-[12px] font-medium text-gray-900",
                )}
                onClick={() => remove(id)}
              >
                {lbl}
                {row ? (
                  <span className="text-[10px] font-normal uppercase tracking-wide text-gray-500">
                    {kindBadge(row.kind)}
                  </span>
                ) : null}
                <span className="text-gray-500" aria-hidden>
                  ×
                </span>
                <span className="sr-only">Ta bort {lbl}</span>
              </button>
            );
          })}
        </div>
      ) : purpose === "agentFilter" ? (
        <p className="text-[12px] text-gray-600">
          Ingen geografisk begränsning — kryssa för att visa köpare på valda platser eller
          kommuner.
        </p>
      ) : (
        <p className="text-[12px] text-gray-600">
          Välj minst ett område, en ort eller ett samhälle.
        </p>
      )}

      <div
        className={cn(
          "max-h-[min(40vh,280px)] overflow-y-auto rounded-xl border border-gray-100 bg-white/70 p-1.5",
          busy && "opacity-55",
        )}
        aria-busy={busy}
        aria-label="Söklista över Sveriges orter och Stockholmsmikroområden"
      >
        {busy ? (
          <p className="px-2 py-4 text-center text-[13px] text-gray-500">
            Laddar platser för hela Sverige…
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-3 text-center text-[13px] text-gray-500">
            Inga träffar — prova ett annat sökord.
          </p>
        ) : (
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
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex justify-between gap-2">
                        <span>{d.label}</span>
                        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          {kindBadge(d.kind)}
                        </span>
                      </span>
                      {d.sub ? (
                        <span className="text-[11px] text-gray-500">{d.sub}</span>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** @deprecated exporteras för bakåtkompabilitet */
export const BuyerDistrictPicker = BuyerLocationPicker;
