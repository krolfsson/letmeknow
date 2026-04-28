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
      typeof body.dwellingType === "string" ? body.dwellingType : "";
    const rooms = typeof body.rooms === "string" ? body.rooms : "";
    if (!dwellingType) missing.push("dwellingType");
    if (!rooms) missing.push("rooms");

    const budgetMinSEK = parseBudget(body.budgetMinSEK);
    const budgetMaxSEK = parseBudget(body.budgetMaxSEK);
    if (!(budgetMinSEK > 0)) missing.push("budgetMinSEK");
    if (!(budgetMaxSEK > 0 && budgetMaxSEK >= budgetMinSEK)) {
      missing.push("budgetRange");
    }

    const tl = body.timeline as BuyerLead["timeline"] | undefined;
    const timelines: BuyerLead["timeline"][] = ["nu", "3man", "6man"];
    if (!tl || !timelines.includes(tl)) missing.push("timeline");

    const fin = body.financing as BuyerLead["financing"] | undefined;
    const fins: BuyerLead["financing"][] = ["kontant", "banklan", "osaker"];
    if (!fin || !fins.includes(fin)) missing.push("financing");

    if (missing.length) {
      return NextResponse.json({ error: "Invalid form", missing }, { status: 400 });
    }

    if (!tl || !fin) {
      return NextResponse.json({ error: "Validering misslyckades." }, { status: 400 });
    }

    const geo = parseGeoJson(body.mapAreaGeoJson ?? null);

    const lead: BuyerLead = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name,
      email,
      phone,
      dwellingType,
      rooms,
      areaSqmMin: parseSqm(body.areaSqmMin ?? null),
      areaSqmMax: parseSqm(body.areaSqmMax ?? null),
      budgetMinSEK,
      budgetMaxSEK,
      timeline: tl,
      financing: fin,
      balcony: Boolean(body.balcony),
      elevator: Boolean(body.elevator),
      petFriendly: Boolean(body.petFriendly),
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
