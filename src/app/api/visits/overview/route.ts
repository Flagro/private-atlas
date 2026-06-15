import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getVisitRollupTotals, getVisitGeoSummary } from "@/features/visits";
import { getVisitInsights } from "@/features/visits/insights";
import { problemUnexpected } from "@/lib/api-errors";
import { withApiLogging } from "@/lib/logger";

async function getOverview(_request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const [totals, geo, insights] = await Promise.all([
      getVisitRollupTotals(auth.user.id),
      getVisitGeoSummary(auth.user.id),
      getVisitInsights(auth.user.id),
    ]);

    return NextResponse.json({ totals, geo, insights });
  } catch (err) {
    return problemUnexpected(err, "GET /api/visits/overview");
  }
}

export const GET = withApiLogging("GET /api/visits/overview", getOverview);
