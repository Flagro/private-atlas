import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getCountriesWithVisitStatus } from "@/features/places";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const countries = await getCountriesWithVisitStatus(auth.user.id);
  return NextResponse.json(countries);
}
