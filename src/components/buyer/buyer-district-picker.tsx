"use client";

import { Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  STOCKHOLM_AREAS,
  normalizeForSearch,
  STOCKHOLM_KOMMUNKOD,
} from "@/lib/stockholm-stadsdelar";
import type { SwedenPlaceRow } from "@/lib/sweden-place-index";
import { loadSwedenPlaceIndex } from "@/lib/sweden-place-index";
import { cn } from "@/lib/cn";

const wrapCn =
  "rounded-xl border border-emerald-700/25 bg-white shadow-sm ring-1 ring-emerald-500/10";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Fet grön träff på söksträngen (som Hemnet). */
function HighlightMatch(props: { text: string; normQ: string }) {
  const q = normalizeForSearch(props.normQ.trim());
  if (!q) {
    return <span className="font-normal text-gray-900">{props.text}</span>;
  }
  let re: RegExp;
  try {
    re = new RegExp(`(${escapeRegex(q)})`, "giu");
  } catch {
    return <span className="font-normal text-gray-900">{props.text}</span>;
  }
  const parts = props.text.split(re);
  return (
    <span>
      {parts.map((part, i) => {
        if (part === "") return null;
        const isMatch = i % 2 === 1;
        return (
          <span
            key={`${i}-${part.slice(0, 8)}`}
            className={
              isMatch
                ? "font-semibold text-emerald-600"
                : "font-normal text-gray-900"
            }
          >
            {part}
          </span>
        );
      })}
    </span>
  );
}

function mergeRows(nationalRows: SwedenPlaceRow[]): SwedenPlaceRow[] {
  const sthlmMapped: SwedenPlaceRow[] = STOCKHOLM_AREAS.map((d) => ({
    id: d.id,
    label: d.name,
    kind: d.tier === "stadsdel" ? "stockholm-stadsdel" : "stockholm-lokal",
    secondary:
      d.tier === "stadsdel"
        ? "Stockholms stad · stadsdel"
        : "Stockholms kommun · lokalt område",
    kk: STOCKHOLM_KOMMUNKOD,
  }));

  const seenId = new Set(sthlmMapped.map((r) => r.id));
  const rest = nationalRows.filter((r) => !seenId.has(r.id));
  return [...sthlmMapped, ...rest];
}

function scoreRow(normQ: string, label: string, secondary?: string) {
  const nl = normalizeForSearch(label);
  const ns = secondary ? normalizeForSearch(secondary) : "";
  if (nl.startsWith(normQ) || nl === normQ) return 0;
  if (nl.includes(normQ)) return 50;
  if (ns.includes(normQ)) return 120;
  return 999;
}

function dedupeById(rows: SwedenPlaceRow[]): SwedenPlaceRow[] {
  const m = new Map<string, SwedenPlaceRow>();
  for (const r of rows) {
    if (!m.has(r.id)) m.set(r.id, r);
  }
  return [...m.values()];
}

function isKommunGrupp(kind: string): boolean {
  return kind === "kommun";
}

function isOmradenGrupp(kind: string): boolean {
  return !isKommunGrupp(kind);
}

export function BuyerLocationPicker(props: {
  value: string[];
  onChange: (ids: string[]) => void;
  purpose?: "buyerSubmission" | "agentFilter";
}) {
  const { value, onChange, purpose = "buyerSubmission" } = props;
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [nationalRows, setNationalRows] = useState<SwedenPlaceRow[] | null>(
    null,
  );
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

  const corpusDedup = useMemo(() => dedupeById(corpus), [corpus]);

  const idToRow = useMemo(() => new Map(corpusDedup.map((r) => [r.id, r])), [corpusDedup]);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(debouncedQuery);
    if (!q) {
      return corpusDedup.slice(0, 160);
    }

    type Scored = SwedenPlaceRow & { _score: number };
    const ranked: Scored[] = [];
    for (const row of corpusDedup) {
      const s = scoreRow(q, row.label, row.secondary);
      if (s >= 998) continue;
      ranked.push({ ...row, _score: s });
    }
    ranked.sort((x, y) => {
      if (x._score !== y._score) return x._score - y._score;
      return x.label.localeCompare(y.label, "sv");
    });
    /** Max per grupp-ish */
    const out = ranked.slice(0, 140).map((row) => {
      const stripped: SwedenPlaceRow = {
        id: row.id,
        label: row.label,
        kind: row.kind,
        ...(row.secondary ? { secondary: row.secondary } : {}),
        ...(row.kk ? { kk: row.kk } : {}),
      };
      return stripped;
    });
    return dedupeById(out);
  }, [debouncedQuery, corpusDedup]);

  const { kommuner, omraden } = useMemo(() => {
    const k: SwedenPlaceRow[] = [];
    const o: SwedenPlaceRow[] = [];
    for (const row of filtered) {
      if (isKommunGrupp(row.kind)) k.push(row);
      else if (isOmradenGrupp(row.kind)) o.push(row);
    }
    return { kommuner: k, omraden: o };
  }, [filtered]);

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

  const busy = nationalRows === null && !loadErr;

  return (
    <div className="space-y-3">
      {loadErr ? (
        <p className="text-[12px] text-red-700">{loadErr}</p>
      ) : null}

      <label className="block">
        <span className="mb-1 block text-[15px] font-semibold text-gray-900">
          Område
        </span>
        <div className={cn("relative mt-1", wrapCn)}>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600/85"
            strokeWidth={2}
            aria-hidden
          />
          <input
            className={cn(
              "w-full rounded-xl border-0 bg-transparent py-3 pl-10 pr-3 text-[15px] text-gray-900 outline-none placeholder:text-gray-400",
              busy && "cursor-wait opacity-55",
            )}
            type="search"
            inputMode="search"
            placeholder="Till exempel bro, högdalen, sundsvall …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            aria-busy={busy}
            disabled={busy}
          />
          <hr className="border-gray-100" />
          <div className="max-h-[min(46vh,320px)] overflow-y-auto pb-2">
            {busy ? (
              <p className="px-3 py-4 text-center text-[13px] text-gray-500">
                Laddar platser…
              </p>
            ) : filtered.length === 0 && normalizeForSearch(debouncedQuery).length >
              0 ? (
              <p className="px-3 py-4 text-center text-[13px] text-gray-500">
                Inga träffar — prova ett annat sökord.
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-4 text-[13px] text-gray-500">
                Skriv för att söka — kommuner visas först och områden under rubriken
                nedan.
              </p>
            ) : (
              <div className="space-y-1 pt-1">
                {kommuner.length > 0 ? (
                  <>
                    <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Kommun
                    </p>
                    <ul className="divide-y divide-gray-50">
                      {kommuner.map((d) => (
                        <li key={d.id}>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-green-50/80",
                              selectedSet.has(d.id) && "bg-green-50/90",
                            )}
                            onClick={() => toggle(d.id)}
                          >
                            <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-[11px] text-emerald-600">
                              {selectedSet.has(d.id) ? "✓" : ""}
                            </span>
                            <span className="min-w-0 flex-1">
                              <HighlightMatch text={d.label} normQ={debouncedQuery} />
                              {d.secondary ? (
                                <span className="text-[13px] font-normal text-gray-500">
                                  {`, ${d.secondary}`}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {omraden.length > 0 ? (
                  <>
                    <p
                      className={cn(
                        "px-3 pt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400",
                        kommuner.length === 0 && "pt-1",
                      )}
                    >
                      Område
                    </p>
                    <ul className="divide-y divide-gray-50">
                      {omraden.map((d) => (
                        <li key={d.id}>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-green-50/80",
                              selectedSet.has(d.id) && "bg-green-50/90",
                            )}
                            onClick={() => toggle(d.id)}
                          >
                            <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-[11px] text-emerald-600">
                              {selectedSet.has(d.id) ? "✓" : ""}
                            </span>
                            <span className="min-w-0 flex-1">
                              <HighlightMatch text={d.label} normQ={debouncedQuery} />
                              {d.secondary ? (
                                <span className="text-[13px] font-normal text-gray-500">
                                  {`, ${d.secondary}`}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </label>

      {value.length ? (
        <div className="flex flex-wrap gap-1.5">
          {sortSelectedIds(value).map((id) => {
            const row = idToRow.get(id);
            const lbl =
              row?.secondary !== undefined
                ? `${row.label}, ${row.secondary}`
                : (row?.label ?? id);
            return (
              <button
                key={id}
                type="button"
                className={cn(
                  "inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-500/25 bg-green-50 px-2.5 py-0.5 text-[12px] font-medium text-gray-900",
                )}
                onClick={() => remove(id)}
              >
                <span className="truncate">{lbl}</span>
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
          Ingen geografisk begränsning — välj kommuner eller orter för att filtrera.
        </p>
      ) : (
        <p className="text-[12px] text-gray-600">
          Välj minst ett område, en stad eller ett samhälle.
        </p>
      )}
    </div>
  );
}

/** @deprecated exporteras för bakåtkompabilitet */
export const BuyerDistrictPicker = BuyerLocationPicker;
