import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getVisitRollupTotals, getVisitGeoSummary } from "@/features/visits";
import { problemUnexpected } from "@/lib/api-errors";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const [totals, geo] = await Promise.all([
      getVisitRollupTotals(auth.user.id),
      getVisitGeoSummary(auth.user.id),
    ]);

    return NextResponse.json({ totals, geo });
  } catch (err) {
    return problemUnexpected(err, "GET /api/visits/overview");
  }
}
