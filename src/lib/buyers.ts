import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { isValidDistrictId } from "@/lib/stockholm-stadsdelar";

export type Timeline = "nu" | "3man" | "6man";
export type AmenityId = "balcony" | "fireplace" | "elevator";

export const AMENITY_IDS = ["balcony", "fireplace", "elevator"] as const satisfies readonly AmenityId[];

export function isAmenityId(value: string): value is AmenityId {
  return (AMENITY_IDS as readonly string[]).includes(value);
}

/** Det köpare lämnar in från formuläret */
export type BuyerLead = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  dwellingType: string;
  districtIds: string[];
  roomMin: number;
  roomMax: number;
  areaSqmMin: number | null;
  areaSqmMax: number | null;
  budgetMinSEK: number;
  budgetMaxSEK: number;
  timeline: Timeline;
  amenityIds: AmenityId[];
  loanApproved: boolean;
};

const FILENAME = "buyers.json";

function path() {
  return join(process.cwd(), "data", FILENAME);
}

function parseBuyerRow(raw: Record<string, unknown>): BuyerLead {
  const idsRaw = raw.districtIds;
  let districtIds: string[] = [];
  if (Array.isArray(idsRaw)) {
    districtIds = idsRaw
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter(isValidDistrictId);
  }

  const amenitiesRaw = raw.amenityIds;
  const amenityIds = Array.isArray(amenitiesRaw)
    ? amenitiesRaw
        .filter((x): x is string => typeof x === "string")
        .filter(isAmenityId)
    : [];

  return {
    id: typeof raw.id === "string" ? raw.id : "",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
    name: typeof raw.name === "string" ? raw.name : "",
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    dwellingType: typeof raw.dwellingType === "string" ? raw.dwellingType : "",
    districtIds,
    roomMin: typeof raw.roomMin === "number" ? raw.roomMin : 1,
    roomMax: typeof raw.roomMax === "number" ? raw.roomMax : 1,
    areaSqmMin:
      typeof raw.areaSqmMin === "number"
        ? raw.areaSqmMin
        : raw.areaSqmMin === null
          ? null
          : null,
    areaSqmMax:
      typeof raw.areaSqmMax === "number"
        ? raw.areaSqmMax
        : raw.areaSqmMax === null
          ? null
          : null,
    budgetMinSEK:
      typeof raw.budgetMinSEK === "number" ? raw.budgetMinSEK : 0,
    budgetMaxSEK:
      typeof raw.budgetMaxSEK === "number" ? raw.budgetMaxSEK : 0,
    timeline:
      raw.timeline === "nu" || raw.timeline === "3man" || raw.timeline === "6man"
        ? raw.timeline
        : "nu",
    amenityIds,
    loanApproved: Boolean(raw.loanApproved),
  };
}

export async function loadBuyers(): Promise<BuyerLead[]> {
  try {
    const utf8 = await readFile(path(), "utf-8");
    const parsed = JSON.parse(utf8) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) =>
      parseBuyerRow(
        typeof row === "object" && row !== null
          ? (row as Record<string, unknown>)
          : {},
      ),
    );
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
