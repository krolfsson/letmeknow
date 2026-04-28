import { NextResponse } from "next/server";
import { addBuyerLead, loadBuyers, type BuyerLead } from "@/lib/buyers";

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

function parseGeoJson(input: unknown): GeoJSON.FeatureCollection | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  if (o.type === "FeatureCollection" && Array.isArray(o.features)) {
    return o as unknown as GeoJSON.FeatureCollection;
  }
  if (o.type === "Feature" && o.geometry) {
    return {
      type: "FeatureCollection",
      features: [o as unknown as GeoJSON.Feature],
    };
  }
  return null;
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

    if (missing.length) {
      return NextResponse.json({ error: "Invalid form", missing }, { status: 400 });
    }

    const geo = parseGeoJson(body.mapAreaGeoJson ?? null);

    const lead: BuyerLead = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name,
      email,
      phone,
      dwellingType,
      roomMin: rmMin!,
      roomMax: rmMax!,
      areaSqmMin,
      areaSqmMax,
      budgetMinSEK,
      budgetMaxSEK,
      timeline: tl!,
      loanApproved: Boolean(body.loanApproved),
      balcony: Boolean(body.balcony),
      elevator: Boolean(body.elevator),
      parkingWanted: Boolean(body.parkingWanted),
      newerThan1990: Boolean(body.newerThan1990),
      renovationOk: Boolean(body.renovationOk),
      areaNotes:
        typeof body.areaNotes === "string"
          ? body.areaNotes.trim().slice(0, 2000)
          : "",
      mapAreaGeoJson: geo?.features?.length ? geo : null,
    };

    await addBuyerLead(lead);
    return NextResponse.json({ ok: true, id: lead.id });
  } catch {
    return NextResponse.json({ error: "Ogiltigt JSON eller serverfel." }, { status: 400 });
  }
}
