import { tryGetStockholmArea } from "@/lib/stockholm-stadsdelar";

export function locationLabelsForIds(
  ids: string[],
  labelById: ReadonlyMap<string, string>,
): string[] {
  return ids.map((id) => labelForPlacementId(id, labelById));
}

export function labelForPlacementId(
  id: string,
  labelById: ReadonlyMap<string, string>,
): string {
  const s = tryGetStockholmArea(id);
  if (s) return s.name;
  return labelById.get(id) ?? id;
}
