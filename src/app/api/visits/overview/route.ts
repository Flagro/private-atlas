import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getVisitRollupTotals, getVisitGeoSummary } from "@/features/visits";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const [totals, geo] = await Promise.all([
    getVisitRollupTotals(auth.user.id),
    getVisitGeoSummary(auth.user.id),
  ]);

  return NextResponse.json({ totals, geo });
}
