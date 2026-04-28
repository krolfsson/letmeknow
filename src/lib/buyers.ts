import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

export type Financing = "kontant" | "banklan" | "osaker";
export type Timeline = "nu" | "3man" | "6man";

/** Det köpare lämnar in – formulär + ritat område på karta */
export type BuyerLead = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  dwellingType: string;
  rooms: string;
  areaSqmMin: number | null;
  areaSqmMax: number | null;
  budgetMinSEK: number;
  budgetMaxSEK: number;
  timeline: Timeline;
  financing: Financing;
  balcony: boolean;
  elevator: boolean;
  petFriendly: boolean;
  parkingWanted: boolean;
  newerThan1990: boolean;
  renovationOk: boolean;
  areaNotes: string;
  mapAreaGeoJson: GeoJSON.FeatureCollection | null;
};

const FILENAME = "buyers.json";

function path() {
  return join(process.cwd(), "data", FILENAME);
}

export async function loadBuyers(): Promise<BuyerLead[]> {
  try {
    const raw = await readFile(path(), "utf-8");
    return JSON.parse(raw) as BuyerLead[];
  } catch {
    await mkdir(join(process.cwd(), "data"), { recursive: true });
    await saveBuyers([]);
    return [];
  }
}

async function saveBuyers(rows: BuyerLead[]) {
  await writeFile(path(), JSON.stringify(rows, null, 2), "utf-8");
}

export async function addBuyerLead(lead: BuyerLead): Promise<BuyerLead> {
  const rows = await loadBuyers();
  rows.unshift(lead);
  await saveBuyers(rows);
  return lead;
}
