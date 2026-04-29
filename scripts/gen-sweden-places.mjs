/**
 * GeoNames Sverige. P-platser: f[11]=kommunkod (admin2), f[10]=länskod (admin1).
 * ADM1: länskod f[10] när f[6]=A.
 */
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "data");
const SE_TXT = join(DATA_DIR, "SE.txt");
const OUT_JSON = join(ROOT, "public", "sweden-places-search.json");

function ensureSeTxt() {
  if (existsSync(SE_TXT)) return;
  mkdirSync(DATA_DIR, { recursive: true });
  const zip = join(DATA_DIR, "SE.zip");
  console.log("Hämtar GeoNames SE.zip …");
  execSync(`curl -sL -o "${zip}" https://download.geonames.org/export/dump/SE.zip`, {
    stdio: "inherit",
  });
  execSync(`unzip -o -j "${zip}" SE.txt -d "${DATA_DIR}"`, {
    stdio: "inherit",
  });
}

function normKey(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Aktuellt länsnamn från officiell kommunkod — första två siffrorna = länskod.
 * GeoNames admin1 för P-punkter blandar ihop för-1998 länsnamn (“Kristianstads län”)
 * med kommuner som idag är i Skåne län osv.; därför visar vi län utifrån kommunkod.
 */
const PREFIX_TILL_LAN_NAMN = {
  "01": "Stockholms län",
  "03": "Uppsala län",
  "04": "Södermanlands län",
  "05": "Östergötlands län",
  "06": "Jönköpings län",
  "07": "Kronobergs län",
  "08": "Kalmar län",
  "09": "Gotlands län",
  "10": "Blekinge län",
  "12": "Skåne län",
  "13": "Hallands län",
  "14": "Västra Götalands län",
  "17": "Värmlands län",
  "18": "Örebro län",
  "19": "Västmanlands län",
  "20": "Dalarnas län",
  "21": "Gävleborgs län",
  "22": "Västernorrlands län",
  "23": "Jämtlands län",
  "24": "Västerbottens län",
  "25": "Norrbottens län",
};

function lanNamnFranKommunkod(kk) {
  const k = String(kk || "").padStart(4, "0");
  const prefix = k.slice(0, 2);
  return PREFIX_TILL_LAN_NAMN[prefix] ?? "";
}

/** GeoNames: riks-/läns-/kommunstäder (PPLC, PPLA, PPLA2–4) — inte generiska PPL-byn. */
function arKommunhuvudort(fc) {
  if (!fc) return false;
  if (fc === "PPLC" || fc === "PPLA") return true;
  return /^PPLA[234]$/.test(fc);
}

/** “Stockholms län” (GeoNames blandar Ibland “Lan”). */
function lanFranAdm1(f) {
  const blobs = [...(f[3] || "").split(","), f[1]].map((x) => String(x || "").trim());
  const ln = blobs.find((s) => /\s+l[aä]n\b/i.test(s));
  if (ln) {
    let t = ln.trim().replace(/^Stockholms?\s+Län$/i, "Stockholms län");
    t = t.replace(/\bLan\b/g, "län").replace(/\bL[aä]n\b/gi, "län");
    return t;
  }
  return blobs.find((s) => /County\b/i.test(s))?.trim() || null;
}

function parseStockholmBlock(src) {
  const mStad = src.match(/const BLOCK_STADSDEL = `\s*([\s\S]*?)`\s*\.replace/);
  const mLok = src.match(/const BLOCK_LOKALA = `\s*([\s\S]*?)`\s*\.replace/);
  const block = (raw) =>
    [
      ...new Set(
        raw
          .replace(/\s+/g, " ")
          .trim()
          .split("·")
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    ];
  const stad = mStad ? block(mStad[1]) : [];
  const lok = mLok ? block(mLok[1]) : [];
  const allNameLo = new Set([
    ...stad.map((s) => s.toLowerCase()),
    ...lok.map((s) => s.toLowerCase()),
  ]);
  return { allNameLo };
}

/** Geonames säger oftast bara ”Stockholm” för 0180 — visa som Hemnet ”Stockholms kommun”. */
function tillKommunNamn(kk, geNamesPeak) {
  if (kk === "0180") return "Stockholms kommun";
  const s = geNamesPeak.trim().replace(/\s*\(\s*kommun\s*\)\s*$/gi, "").trim();
  if (/\bkommun\b/i.test(s)) return s.replace(/\bk[oö]mun+\b/i, "kommun");
  return `${s} kommun`;
}

async function main() {
  ensureSeTxt();
  const { allNameLo } = parseStockholmBlock(
    readFileSync(join(ROOT, "src", "lib", "stockholm-stadsdelar.ts"), "utf8"),
  );

  /** @type {Map<string, string>} */
  const lanByLanKod = new Map();
  let rlAdm = createInterface({
    input: createReadStream(SE_TXT, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  for await (const line of rlAdm) {
    const f = line.split("\t");
    if (f.length < 13) continue;
    if (f[6] !== "A" || (f[7] !== "ADM1" && f[7] !== "ADM1H")) continue;
    if (f[8] !== "SE") continue;
    const lk = (f[10] || "").trim();
    if (!lk) continue;
    const nm = lanFranAdm1(f);
    if (nm && !lanByLanKod.has(lk)) lanByLanKod.set(lk, nm);
  }

  /** kk → {peakName, lanKod} */
  /** @type {Map<string, { label: string; pop: number; lanKod: string }>} */
  const kommunPeak = new Map();

  /** @type {Array<{ gid: number; name: string; kk: string; pop: number; fc: string }>} */
  const raw = [];

  rlAdm = createInterface({
    input: createReadStream(SE_TXT, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  for await (const line of rlAdm) {
    const f = line.split("\t");
    if (f.length < 15 || f[6] !== "P") continue;
    const kk = (f[11] || "").trim();
    const lanKod = (f[10] || "").trim();
    const gid = Number(f[0], 10);
    const name = f[1];
    const pop = parseInt(f[14] || "0", 10) || 0;
    const fc = f[7] || "";
    if (kk === "0180" && allNameLo.has(name.toLowerCase())) continue;

    raw.push({ gid, name: name.trim(), kk, pop, fc });

    if (kk) {
      const cur = kommunPeak.get(kk);
      if (!cur || pop > cur.pop)
        kommunPeak.set(kk, { label: name.trim(), pop, lanKod });
    }
  }

  /** @type {Array<{ id: string; label: string; secondary?: string; kind: string; kk?: string }>} */
  const out = [];

  const codesSorted = [...kommunPeak.keys()].sort((a, b) =>
    a.localeCompare(b, "sv"),
  );

  const kommunKomplettNamnNyckel = new Set();
  for (const kk of codesSorted) {
    const meta = kommunPeak.get(kk);
    const lbl = tillKommunNamn(kk, meta?.label || `Kommun ${kk}`);
    kommunKomplettNamnNyckel.add(
      `${normKey(lbl.replace(/\s+kommun$/i, "").trim())}|${kk}`,
    );
    const lansNamn =
      lanNamnFranKommunkod(kk) || lanByLanKod.get(meta?.lanKod || "") || "";
    out.push({
      id: `kommun-${kk}`,
      label: lbl,
      ...(lansNamn ? { secondary: lansNamn } : {}),
      kind: "kommun",
      kk,
    });
  }

  raw.sort((a, b) => {
    const d = (b.pop || 0) - (a.pop || 0);
    if (d !== 0) return d;
    return a.name.localeCompare(b.name, "sv");
  });

  /** Dedupe geografiska punkter på nycklar */
  /** @type {Map<string, (typeof raw)[0]>} */
  const bestGeo = new Map();
  for (const row of raw) {
    if (!row.kk) continue;
    const key = `${normKey(row.name)}|${row.kk}`;
    const prev = bestGeo.get(key);
    if (!prev || row.pop > prev.pop) bestGeo.set(key, row);
  }

  function kommunTillOmradeSubtitle(kode) {
    return tillKommunNamn(kode, kommunPeak.get(kode)?.label || "");
  }

  for (const row of bestGeo.values()) {
    /** Samma namn som kommuncentrum — utom kommunhuvudort (finns oftast som PPLA2, t.ex. Helsingborg). */
    const isStad = arKommunhuvudort(row.fc);
    if (
      kommunKomplettNamnNyckel.has(`${normKey(row.name)}|${row.kk}`) &&
      !isStad
    )
      continue;

    const lanLine = lanNamnFranKommunkod(row.kk);
    const secondary =
      isStad && lanLine ? lanLine : kommunTillOmradeSubtitle(row.kk);

    out.push({
      id: `geo-${row.gid}`,
      label: row.name.trim(),
      secondary,
      kind: isStad ? "stad" : "ort",
      kk: row.kk || undefined,
    });
  }

  const seenIds = new Set();
  const slim = [];
  for (const r of out) {
    if (seenIds.has(r.id)) continue;
    seenIds.add(r.id);
    slim.push({
      id: r.id,
      label: r.label,
      kind: r.kind,
      ...(r.secondary ? { secondary: r.secondary } : {}),
      ...(r.kk ? { kk: r.kk } : {}),
    });
  }

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(slim), "utf8");
  console.log(`OK: ${slim.length} platser`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
