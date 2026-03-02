import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getCitiesByCountry } from "@/features/places";

export async function GET(request: Request) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const countryId = searchParams.get("countryId") ?? undefined;

  const cities = await getCitiesByCountry(countryId);
  return NextResponse.json(cities);
}
