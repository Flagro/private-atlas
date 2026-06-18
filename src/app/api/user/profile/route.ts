import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { problemUnexpected } from "@/lib/api-errors";
import { withApiLogging } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function getProfile(_request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { email: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ email: auth.user.email, hasPassword: false });
    }

    return NextResponse.json({
      email: user.email,
      hasPassword: Boolean(user.passwordHash),
    });
  } catch (err) {
    return problemUnexpected(err, "GET /api/user/profile");
  }
}

export const GET = withApiLogging("GET /api/user/profile", getProfile);
