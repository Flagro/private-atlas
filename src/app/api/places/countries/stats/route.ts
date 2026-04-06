import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getCountryStats } from "@/features/places";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const stats = await getCountryStats(auth.user.id);
  return NextResponse.json(stats);
}
