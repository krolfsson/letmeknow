import {
  STOCKHOLM_KOMMUNKOD,
  toStadsdelClusterId,
  tryGetStockholmArea,
} from "@/lib/stockholm-stadsdelar";

export function kommunkodFromKommunId(id: string): string | undefined {
  const m = /^kommun-(\d{4})$/.exec(id);
  return m ? m[1] : undefined;
}

/** Kommun 4-digit kod om id är stockholm-/kommun-/ eller geo-med metadata. */
export function kommunkodForPlacementId(
  id: string,
  kkByGeoId: ReadonlyMap<string, string>,
): string | undefined {
  if (tryGetStockholmArea(id)) return STOCKHOLM_KOMMUNKOD;
  const kKom = kommunkodFromKommunId(id);
  if (kKom) return kKom;
  if (id.startsWith("geo-")) return kkByGeoId.get(id);
  return undefined;
}

/**
 * Köpars val `buyerPlacementId` jämfört med ett av mäklarens filter-val `filterPlacementId`.
 * Olika geografiska punkter (`geo-*`) vägs inte ihop på namn även vid samma kommun —
 * kommunnivå matchar bredare geografiska val med samma kk.
 */
export function placeringMatcharFilter(
  buyerPlacementId: string,
  filterPlacementId: string,
  kkByGeoId: ReadonlyMap<string, string>,
): boolean {
  if (buyerPlacementId === filterPlacementId) return true;

  const bStock = tryGetStockholmArea(buyerPlacementId);
  const fStock = tryGetStockholmArea(filterPlacementId);
  const kb = kommunkodForPlacementId(buyerPlacementId, kkByGeoId);
  const kf = kommunkodForPlacementId(filterPlacementId, kkByGeoId);

  if (bStock && fStock)
    return toStadsdelClusterId(buyerPlacementId) === toStadsdelClusterId(filterPlacementId);

  /** Två konkreta orter måste verkligen vara samma lista-rad eller matchas bredare nedan — aldrig "samma kommunkod på två geo". */
  if (
    buyerPlacementId.startsWith("geo-") &&
    filterPlacementId.startsWith("geo-") &&
    buyerPlacementId !== filterPlacementId
  )
    return false;

  /**
   * Vår Stockholm-stadsdel/område mot GeoNames-ort Stockholms kommun (kk 0180), eller tvärtom.
   * Samma kommunkod, men bara ena sidan är från vår granular lista.
   */
  if (
    kb &&
    kb === kf &&
    kb === STOCKHOLM_KOMMUNKOD &&
    (bStock || fStock) &&
    buyerPlacementId.startsWith("geo-") !== filterPlacementId.startsWith("geo-")
  )
    return true;

  /** Mäklare valt kommunnivå: ta med alla placeringar i den kommunen. */
  const filterKom = kommunkodFromKommunId(filterPlacementId);
  if (filterKom && kb === filterKom) return true;

  /** Köpare valt kommunnivå: filt ska kunna sätta detaljer inom kommun eller samma kommunkod. */
  const buyerKom = kommunkodFromKommunId(buyerPlacementId);
  if (buyerKom && kf === buyerKom && !filterPlacementId.startsWith("geo-"))
    return true;
  /** köpare kommunkod + filt kommun kod */
  if (
    buyerKom &&
    filterKom &&
    buyerKom === filterKom
  )
    return true;

  if (
    buyerKom &&
    filterPlacementId.startsWith("geo-") &&
    kommunkodForPlacementId(filterPlacementId, kkByGeoId) === buyerKom
  )
    return true;

  if (
    buyerPlacementId.startsWith("geo-") &&
    filterKom &&
    kb === filterKom
  )
    return true;

  /** Stockholmsklyster (stadsdel) mot köpare kommunkod eller hel kommun filt */
  if (bStock || fStock) {
    if (
      filterPlacementId === `kommun-${STOCKHOLM_KOMMUNKOD}` &&
      kommunkodForPlacementId(buyerPlacementId, kkByGeoId) === STOCKHOLM_KOMMUNKOD
    )
      return true;
    if (
      buyerPlacementId === `kommun-${STOCKHOLM_KOMMUNKOD}` &&
      kommunkodForPlacementId(filterPlacementId, kkByGeoId) === STOCKHOLM_KOMMUNKOD
    )
      return true;
    if (buyerKom === STOCKHOLM_KOMMUNKOD && fStock) return true;
    if (filterKom === STOCKHOLM_KOMMUNKOD && bStock) return true;
  }

  return false;
}
