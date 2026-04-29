/** Stadsdelar + lokala områdesnamn inom Stockholm stad (köpare väljer vad som matchar säljarens språk). */

export type StockholmAreaTier = "stadsdel" | "lokalt";

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
const lokalRows = rowsFrom(lokalFiltered, "lokalt");

/**
 * Kombinerad lista: stadsdelar + lokala områden — sök över alla, id är globalt unik.
 */
export const STOCKHOLM_AREAS: readonly {
  readonly id: string;
  readonly name: string;
  readonly tier: StockholmAreaTier;
}[] = [...stadRows, ...lokalRows].sort((a, b) =>
  a.name.localeCompare(b.name, "sv"),
);

/** Alias — samma struktur kan adresseras med det gamla exportnamnet i kod/importer */
export const STOCKHOLM_STADSDELAR = STOCKHOLM_AREAS;

const byId = new Map(STOCKHOLM_AREAS.map((d) => [d.id, d]));

export function isValidDistrictId(id: string): boolean {
  return byId.has(id);
}

export function districtIdsToNames(ids: string[]): string[] {
  return ids.map((i) => byId.get(i)?.name ?? i);
}

export function normalizeForSearch(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}
