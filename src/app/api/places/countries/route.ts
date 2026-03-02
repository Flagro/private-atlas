import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getCountriesWithVisitStatus } from "@/features/places";

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const countries = await getCountriesWithVisitStatus(user!.id);
  return NextResponse.json(countries);
}
