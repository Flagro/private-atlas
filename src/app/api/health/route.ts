import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Liveness / readiness for load balancers and PaaS.
 * GET — pings the database; returns 503 if the DB is unreachable.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      checks: { database: "up" },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[health] database check failed:", err);
    return NextResponse.json(
      {
        status: "unhealthy",
        checks: { database: "down" },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
