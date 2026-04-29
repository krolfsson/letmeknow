/** Stadsdelar + lokala områdesnamn inom Stockholm stad (köpare väljer vad som matchar säljarens språk). */

export type StockholmAreaTier = "stadsdel" | "lokalt";

type StockholmAreaRow = {
  readonly id: string;
  readonly name: string;
  readonly tier: StockholmAreaTier;
  /** Endast för lokala områden: vilken stadsdel de hör till (för klustring i filter). */
  readonly parentStadsdelId?: string;
};

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function parseBlock(raw: string): string[] {
  return [
    ...new Set(raw.replace(/\s+/g, " ").trim().split("·").map((s) => s.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "sv"));
}

/** officiella stadsdelar · (samma källa som tidigare i projektet) */
const BLOCK_STADSDEL = `
Abrahamsberg · Alvik · Beckomberga · Blackeberg · Bromma Kyrka · Bällsta · Eneby · Höglandet · Mariehäll · Nockeby · Nockebyhov · Norra Ängby · Olovslund · Riksby · Smedslätten · Stora Mossen · Södra Ängby · Traneberg · Ulvsunda · Ulvsunda Industriområde · Åkeshov · Åkeslund · Ålsten · Äppelviken · Bandhagen · Enskede gård · Enskedefältet · Gamla Enskede · Hagsätra · Hammarbyhöjden · Högdalen · Johanneshov · Rågsved · Stureby · Årsta · Örby · Östberga · Fagersjö · Farsta · Farsta Strand · Gubbängen · Hökarängen · Larsboda · Sköndal · Svedmyra · Tallkrogen · Aspudden · Fruängen · Gröndal · Hägersten · Hägerstensåsen · Liljeholmen · Midsommarkransen · Mälarhöjden · Västberga · Västertorp · Herrängen · Liseberg · Långbro · Långsjö · Solberga · Älvsjö · Örby Slott · Grimsta · Hässelby Gård · Hässelby Strand · Hässelby Villastad · Kälvesta · Nälsta · Råcksta · Vinsta · Vällingby · Akalla · Bromsten · Flysta · Husby · Kista · Lunda · Rinkeby · Solhem · Sundby · Tensta · Fredhäll · Kristineberg · Kungsholm · Lilla Essingen · Marieberg · Stadshagen · Stora Essingen · Djurgården · Gärdet · Hjorthagen · Norra Djurgården · Norrmalm · Skeppsholmen · Vasastan · Östermalm · Bagarmossen · Björkhagen · Enskededalen · Flaten · Kärrtorp · Orhem · Skarpnäcks Gård · Skrubba · Bredäng · Skärholmen · Sätra · Vårberg · Gamla stan · Långholmen · Reimersholme · Riddarholmen · Södermalm · Södra Hammarbyhamnen
`.replace(/\s+/g, " ").trim();

/**
 * Lokala områden / vanliga namn på delar av staden (inte samma officiella lista som “stadsdel”).
 * Vid behov är det enkelt att fylla på fler namn nedan eller dela ut i separat JSON-fil.
 */
const BLOCK_LOKALA = `
Hornstull · Mariatorget · Mariatorgets backar · Mariaberget · Slussen · Zinkensdamm · Maria · Sofia · Högalid · Norra Högalid · Mellersta Högalid · Södra Högalid · Högalidsparken · Sofia kyrka · Drakenberg · Tanto · Tantolunden · Eriksdal · Skanstull · Danvikstull · Mosebacke · Götgatsbacken · Fåfängan · Fiskargatan · Fjällgatan · Katarina · Ersta · Ivar Los park · Årstavik · Årstadal · Årstadalshamnen · Årstabron · Sjövägen hammarby · Hammarby kaj · Sjöstadshamnen · Norra djurgårdsstaden · Hagastaden · Karolinska · Stureplatå · Karlaplan · Humlegården · Kungsträdgården · Gustav Adolfs torg · Strandvägen · Nybroplan · Blasieholmen · Kungliga Slottsparken · Skeppsbron · Stadsgården · Söder mälarstrand · Norr mälarstrand · Sankt Eriksplan · Odenplan · Birkastan · Sibirien · Vasaparken · Sabbatsberg · Rödaberg · Surbrunn · Vanadislunden · Torsparken · Rådmansgatan · Karlbergsstrand · Hagaparken · Brunnsvik · Fridhemsplan · Fleminggatan · Hantverkargatan · Scheelegatan · Rålambshovsleden · Stadshagens strand · Thorildsplan · Vällingby centrum · Arenastaden · Kista torv · Ursvik natur · Åkalla sjö · Spånga torg · Rinkeby torg · Järnvägstorget · Telefonplan · Farsta strandsbad · Vinterviken · Högdalstoppen · Kärrtorp berg · Gubbängen centrum
`.replace(/\s+/g, " ").trim();

const USED_IDS = new Set<string>();

function idFor(base: string): string {
  const b = slug(base) || "omrade";
  let id = b;
  let n = 1;
  while (USED_IDS.has(id)) {
    n++;
    id = `${b}-${n}`;
  }
  USED_IDS.add(id);
  return id;
}

function rowsFrom(names: readonly string[], tier: StockholmAreaTier) {
  return names.map((name) => ({
    id: idFor(name),
    name,
    tier,
  }));
}

/** Officiella stadsdelar (dedupe i parseBlock). */
const stadNamesAll = parseBlock(BLOCK_STADSDEL);

/** Lokala namn minus exakt dubletter mot stad (sällsynt om samma ord förekommer) */
const stadNameSetLower = new Set(stadNamesAll.map((s) => s.toLowerCase()));
const lokalParsed = parseBlock(BLOCK_LOKALA);
/** Filtrera bort uppenbara dubbletnamn eller tomma artefakter ifall listan växer */
const lokalFiltered = lokalParsed.filter((n) => !stadNameSetLower.has(n.toLowerCase()));

/** Sorterade rader för export */
const stadRows = rowsFrom(stadNamesAll, "stadsdel");

/**
 * Mappa lokala områden till “parent” stadsdel.
 * Detta gör att t.ex. Hornstull matchar Södermalm i mäklarfilter.
 * Saknas mapping → området står “på egna ben” (ingen klustring).
 */
const LOCAL_PARENT_BY_NAME: Record<string, string> = {
  // Södermalm
  Hornstull: "Södermalm",
  Mariatorget: "Södermalm",
  "Mariatorgets backar": "Södermalm",
  Mariaberget: "Södermalm",
  Slussen: "Södermalm",
  Zinkensdamm: "Södermalm",
  Maria: "Södermalm",
  Sofia: "Södermalm",
  Högalid: "Södermalm",
  "Norra Högalid": "Södermalm",
  "Mellersta Högalid": "Södermalm",
  "Södra Högalid": "Södermalm",
  Högalidsparken: "Södermalm",
  "Sofia kyrka": "Södermalm",
  Drakenberg: "Södermalm",
  Tanto: "Södermalm",
  Tantolunden: "Södermalm",
  Eriksdal: "Södermalm",
  Skanstull: "Södermalm",
  Danvikstull: "Södermalm",
  Mosebacke: "Södermalm",
  Götgatsbacken: "Södermalm",
  Fåfängan: "Södermalm",
  Fiskargatan: "Södermalm",
  Fjällgatan: "Södermalm",
  Katarina: "Södermalm",
  Ersta: "Södermalm",
  "Ivar Los park": "Södermalm",
  Stadsgården: "Södermalm",
  "Söder mälarstrand": "Södermalm",

  // Årsta / Hammarby
  Årstavik: "Årsta",
  Årstadal: "Årsta",
  Årstadalshamnen: "Årsta",
  Årstabron: "Årsta",
  "Sjövägen hammarby": "Södra Hammarbyhamnen",
  "Hammarby kaj": "Södra Hammarbyhamnen",
  Sjöstadshamnen: "Södra Hammarbyhamnen",

  // Östermalm / Norrmalm
  Stureplatå: "Östermalm",
  Karlaplan: "Östermalm",
  Humlegården: "Östermalm",
  Strandvägen: "Östermalm",
  Nybroplan: "Östermalm",
  "Gustav Adolfs torg": "Norrmalm",
  Kungsträdgården: "Norrmalm",
  Blasieholmen: "Norrmalm",
  "Kungliga Slottsparken": "Norrmalm",
  Skeppsbron: "Gamla stan",

  // Vasastan
  "Sankt Eriksplan": "Vasastan",
  Odenplan: "Vasastan",
  Birkastan: "Vasastan",
  Sibirien: "Vasastan",
  Vasaparken: "Vasastan",
  Sabbatsberg: "Vasastan",
  Rödaberg: "Vasastan",
  Surbrunn: "Vasastan",
  Vanadislunden: "Vasastan",
  Torsparken: "Vasastan",
  Rådmansgatan: "Vasastan",
  Karlbergsstrand: "Vasastan",
  Hagastaden: "Vasastan",
  Karolinska: "Vasastan",
  Hagaparken: "Vasastan",
  Brunnsvik: "Vasastan",

  // Kungsholmen
  Fridhemsplan: "Kungsholm",
  Fleminggatan: "Kungsholm",
  Hantverkargatan: "Kungsholm",
  Scheelegatan: "Kungsholm",
  Rålambshovsleden: "Kungsholm",
  "Stadshagens strand": "Stadshagen",
  Thorildsplan: "Kristineberg",
  "Norr mälarstrand": "Kungsholm",

  // Norra Djurgården (lokal variant)
  "Norra djurgårdsstaden": "Norra Djurgården",

  // Ytterstaden (några exempel)
  "Vällingby centrum": "Vällingby",
  "Kista torv": "Kista",
  "Åkalla sjö": "Akalla",
  "Rinkeby torg": "Rinkeby",
  "Spånga torg": "Solhem",
  Telefonplan: "Midsommarkransen",
  "Farsta strandsbad": "Farsta Strand",
  Vinterviken: "Aspudden",
  Högdalstoppen: "Högdalen",
  "Kärrtorp berg": "Kärrtorp",
  "Gubbängen centrum": "Gubbängen",
};

const stadIdByNameLower = new Map(
  stadRows.map((r) => [r.name.toLowerCase(), r.id]),
);

function parentStadsdelIdForLocalName(name: string): string | undefined {
  const parentName = LOCAL_PARENT_BY_NAME[name];
  if (!parentName) return undefined;
  return stadIdByNameLower.get(parentName.toLowerCase());
}

const lokalRows: StockholmAreaRow[] = rowsFrom(lokalFiltered, "lokalt").map((r) => ({
  ...r,
  parentStadsdelId: parentStadsdelIdForLocalName(r.name),
}));

/**
 * Kombinerad lista: stadsdelar + lokala områden — sök över alla, id är globalt unik.
 */
export const STOCKHOLM_AREAS: readonly {
  readonly id: string;
  readonly name: string;
  readonly tier: StockholmAreaTier;
  readonly parentStadsdelId?: string;
}[] = [...stadRows, ...lokalRows].sort((a, b) =>
  a.name.localeCompare(b.name, "sv"),
);

/** Alias — samma struktur kan adresseras med det gamla exportnamnet i kod/importer */
export const STOCKHOLM_STADSDELAR = STOCKHOLM_AREAS;

const byId = new Map(STOCKHOLM_AREAS.map((d) => [d.id, d]));

/** Stockholms stads kommunkod GeoNames/admin2 för landets kommunfilt. */
export const STOCKHOLM_KOMMUNKOD = "0180";

export function tryGetStockholmArea(id: string) {
  return byId.get(id);
}

export function isValidDistrictId(id: string): boolean {
  return byId.has(id);
}

export function districtIdsToNames(ids: string[]): string[] {
  return ids.map((i) => byId.get(i)?.name ?? i);
}

/** Normalisera ett område till dess “stadsdel-kluster”. */
export function toStadsdelClusterId(id: string): string {
  const row = byId.get(id);
  if (!row) return id;
  if (row.tier === "stadsdel") return row.id;
  return row.parentStadsdelId ?? row.id;
}

export function normalizeForSearch(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}
