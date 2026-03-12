import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getCountryStats } from "@/features/places";

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const stats = await getCountryStats(user!.id);
  return NextResponse.json(stats);
}
