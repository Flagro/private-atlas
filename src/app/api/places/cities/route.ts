import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getCitiesByCountry } from "@/features/places";
import { ApiErrorCode, problemResponse } from "@/lib/api-errors";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const countryId = searchParams.get("countryId")?.trim();
  if (!countryId) {
    return problemResponse(
      {
        message: "Query parameter countryId is required.",
        code: ApiErrorCode.MISSING_QUERY,
      },
      400
    );
  }

  const cities = await getCitiesByCountry(countryId);
  return NextResponse.json(cities);
}
