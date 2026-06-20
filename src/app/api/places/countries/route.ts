import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getCountriesWithVisitStatus } from "@/features/places";
import { withApiLogging } from "@/lib/logger";

async function getCountries(_request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const countries = await getCountriesWithVisitStatus(auth.user.id);
  return NextResponse.json(countries);
}

export const GET = withApiLogging("GET /api/places/countries", getCountries);
