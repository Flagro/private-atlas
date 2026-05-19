import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { problemUnexpected } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

/**
 * Permanently deletes the signed-in user and all related data (visits, OAuth links).
 * Prisma cascades on User delete.
 */
export async function DELETE() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    await prisma.user.delete({ where: { id: auth.user.id } });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return problemUnexpected(err, "DELETE /api/user");
  }
}
