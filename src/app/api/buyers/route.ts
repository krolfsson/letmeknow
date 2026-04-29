import { NextResponse } from "next/server";
import {
  addBuyerLead,
  isAmenityId,
  loadBuyers,
  type AmenityId,
  type BuyerLead,
} from "@/lib/buyers";
import { isValidLocationId } from "@/lib/location-ids";

function parseBudget(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function parseSqm(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseRoom(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export async function GET() {
  const rows = await loadBuyers();
  return NextResponse.json(rows);
}

const ROOM_ABS_MIN = 1;
const ROOM_ABS_MAX = 5;
const KVM_MIN = 25;
const KVM_MAX = 300;
const BUDGET_FLOOR = 250_000;
const BUDGET_CEIL = 40_000_000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<BuyerLead> &
      Record<string, unknown>;

    const missing: string[] = [];
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (!name) missing.push("name");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missing.push("email");
    if (!phone) missing.push("phone");

    const dwellingType =
      typeof body.dwellingType === "string" ? body.dwellingType.trim() : "";
    if (!dwellingType) missing.push("dwellingType");

    const districtRaw = body.districtIds;
    let districtIds: string[] = [];
    if (!Array.isArray(districtRaw)) {
      missing.push("districtIds");
    } else {
      const cand = [...new Set(
        districtRaw
          .filter((x): x is string => typeof x === "string")
          .map((s) => s.trim())
          .filter(Boolean),
      )];
      if (!cand.length || cand.some((id) => !isValidLocationId(id))) {
        missing.push("districtIds");
      } else {
        districtIds = cand;
      }
    }

    const rmMin = parseRoom(body.roomMin);
    const rmMax = parseRoom(body.roomMax);
    if (
      rmMin === undefined ||
      rmMax === undefined ||
      rmMin < ROOM_ABS_MIN ||
      rmMax > ROOM_ABS_MAX ||
      rmMin > rmMax
    ) {
      missing.push("roomsRange");
    }

    const areaSqmMin = parseSqm(body.areaSqmMin ?? null);
    const areaSqmMax = parseSqm(body.areaSqmMax ?? null);
    if (
      areaSqmMin === null ||
      areaSqmMax === null ||
      areaSqmMin < KVM_MIN ||
      areaSqmMax > KVM_MAX ||
      areaSqmMin > areaSqmMax
    ) {
      missing.push("kvmRange");
    }

    const budgetMinSEK = parseBudget(body.budgetMinSEK);
    const budgetMaxSEK = parseBudget(body.budgetMaxSEK);
    if (!(budgetMinSEK >= BUDGET_FLOOR)) missing.push("budgetMinSEK");
    if (!(budgetMaxSEK >= budgetMinSEK && budgetMaxSEK <= BUDGET_CEIL)) {
      missing.push("budgetRange");
    }

    const tl = body.timeline as BuyerLead["timeline"] | undefined;
    const timelines: BuyerLead["timeline"][] = ["nu", "3man", "6man"];
    if (!tl || !timelines.includes(tl)) missing.push("timeline");

    const amenityRaw = body.amenityIds;
    const amenityIds: AmenityId[] = [];
    if (Array.isArray(amenityRaw)) {
      for (const value of amenityRaw) {
        if (
          typeof value === "string" &&
          isAmenityId(value) &&
          !amenityIds.includes(value)
        ) {
          amenityIds.push(value);
        }
      }
    }

    if (missing.length) {
      return NextResponse.json({ error: "Invalid form", missing }, { status: 400 });
    }

    const lead: BuyerLead = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name,
      email,
      phone,
      dwellingType,
      districtIds,
      roomMin: rmMin!,
      roomMax: rmMax!,
      areaSqmMin,
      areaSqmMax,
      budgetMinSEK,
      budgetMaxSEK,
      timeline: tl!,
      amenityIds,
      loanApproved: Boolean(body.loanApproved),
    };

    await addBuyerLead(lead);
    return NextResponse.json({ ok: true, id: lead.id });
  } catch {
    return NextResponse.json({ error: "Ogiltigt JSON eller serverfel." }, { status: 400 });
  }
}
