import { readFileSync } from "fs";
import { join } from "path";
import { STOCKHOLM_AREAS, tryGetStockholmArea } from "@/lib/stockholm-stadsdelar";

let allowedIdsCache: ReadonlySet<string> | null = null;

function getAllowedIds(): ReadonlySet<string> {
  if (allowedIdsCache) return allowedIdsCache;
  const pathJson = join(process.cwd(), "public", "sweden-places-search.json");
  let rows: readonly { readonly id: string }[] = [];
  try {
    rows = JSON.parse(readFileSync(pathJson, "utf8")) as { id: string }[];
  } catch {
    rows = [];
  }
  const s = new Set<string>();
  for (const r of rows) {
    if (r?.id) s.add(r.id);
  }
  for (const a of STOCKHOLM_AREAS) s.add(a.id);
  allowedIdsCache = s;
  return s;
}

export function isValidLocationId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  if (tryGetStockholmArea(id)) return true;
  return getAllowedIds().has(id);
}
