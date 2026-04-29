/**
 * Bygger sökbar lista från GeoNames Sverige (P = bebodda platser) + kommuner.
 * Kör från projektrot: node scripts/gen-sweden-places.mjs
 * Kräver curl + unzip (annars lägg ./data/SE.txt manuellt).
 */
import { readFileSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createReadStream } from "node:fs";
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
  execSync(
    `curl -sL -o "${zip}" "https://download.geonames.org/export/dump/SE.zip"`,
    { stdio: "inherit" },
  );
  execSync(`unzip -o -j "${zip}" SE.txt -d "${DATA_DIR}"`, {
    stdio: "inherit",
  });
}

function parseStockholmNames(src) {
  const mStad = src.match(/const BLOCK_STADSDEL = `\s*([\s\S]*?)`\s*\.replace/);
  const mLok = src.match(/const BLOCK_LOKALA = `\s*([\s\S]*?)`\s*\.replace/);
  const parseBlock = (raw) =>
    [
      ...new Set(
        raw
          .replace(/\s+/g, " ")
          .trim()
          .split("·")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ];
  const stad = mStad ? parseBlock(mStad[1]) : [];
  const lok = mLok ? parseBlock(mLok[1]) : [];
  const allNameLo = new Set([
    ...stad.map((s) => s.toLowerCase()),
    ...lok.map((s) => s.toLowerCase()),
  ]);
  return { allNameLo };
}

async function main() {
  ensureSeTxt();
  const sthlmSrc = readFileSync(
    join(ROOT, "src", "lib", "stockholm-stadsdelar.ts"),
    "utf8",
  );
  const { allNameLo } = parseStockholmNames(sthlmSrc);

  /** @type {Array<{ id: string; label: string; sub?: string; kk?: string; kind: string; pop?: number }>} */
  const out = [];

  /** @type {Map<string, { label: string; pop: number }>} */
  const kommunPeak = new Map();

  const rl = createInterface({
    input: createReadStream(SE_TXT, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  /** @type {Array<{ gid: number; name: string; ascii: string; kk: string; pop: number; fc: string }>} */
  const raw = [];

  for await (const line of rl) {
    const f = line.split("\t");
    if (f.length < 15 || f[6] !== "P") continue;
    const gid = Number(f[0], 10);
    const name = f[1];
    const ascii = f[2] || name;
    const admin2 = (f[12] || "").trim();
    const pop = parseInt(f[14] || "0", 10) || 0;
    const fc = f[7] || "";
    const nameLo = name.toLowerCase();

    if (admin2 === "0180" && allNameLo.has(nameLo)) continue;

    raw.push({ gid, name, ascii, kk: admin2, pop, fc });

    if (admin2) {
      const cur = kommunPeak.get(admin2);
      if (!cur || pop > cur.pop)
        kommunPeak.set(admin2, { label: name.trim(), pop });
    }
  }

  /** Kommuner med id kommun-xxxx */
  const codesSorted = [...kommunPeak.keys()].sort((a, b) => a.localeCompare(b, "sv"));
  for (const code of codesSorted) {
    const meta = kommunPeak.get(code);
    const label = meta?.label
      ? `${meta.label}${meta.label.toLowerCase().includes("kommun") ? "" : " (kommun)"}`
      : `Kommun ${code}`;
    out.push({
      id: `kommun-${code}`,
      label,
      kind: "kommun",
      kk: code,
      pop: meta?.pop ?? 0,
    });
  }

  /** Orter (geo-geoid) — satta efter pop */
  raw.sort((a, b) => {
    const d = (b.pop || 0) - (a.pop || 0);
    if (d !== 0) return d;
    return a.name.localeCompare(b.name, "sv");
  });

  function subFor(row) {
    if (!row.kk) return "Sverige";
    const kp = kommunPeak.get(row.kk);
    return kp ? `Kommun • ${kp.label}` : `Kommun ${row.kk}`;
  }

  for (const row of raw) {
    out.push({
      id: `geo-${row.gid}`,
      label: row.name,
      sub: subFor(row),
      kind: row.fc === "PPLC" ? "stad" : "ort",
      kk: row.kk || undefined,
      pop: row.pop,
    });
  }

  /** Slim för webben: ingen pop till klient för att snåla (behåller sorteringen i lista) */
  const slim = out.map((r) => {
    const next = {
      id: r.id,
      label: r.label,
      ...(r.sub ? { sub: r.sub } : {}),
      kind: r.kind,
      ...(r.kk ? { kk: r.kk } : {}),
    };
    return next;
  });

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(slim), "utf8");

  console.log(`Wrote ${slim.length} rader till public/sweden-places-search.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
