import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import {
  ApiErrorCode,
  problemResponse,
  problemUnexpected,
} from "@/lib/api-errors";
import { deleteAccountSchema } from "@/lib/validations/user";

export const dynamic = "force-dynamic";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Permanently deletes the signed-in user and all related data (visits, OAuth links).
 * Prisma cascades on User delete. Requires confirmEmail matching the session email.
 */
export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);
    if (!body) {
      return problemResponse(
        {
          message: "Request body must be valid JSON.",
          code: ApiErrorCode.INVALID_JSON,
        },
        400
      );
    }

    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(
        {
          message: "Invalid confirmation.",
          code: ApiErrorCode.VALIDATION_FAILED,
          details: parsed.error.flatten(),
        },
        400
      );
    }

    if (
      normalizeEmail(parsed.data.confirmEmail) !==
      normalizeEmail(auth.user.email)
    ) {
      return problemResponse(
        {
          message: "Email confirmation does not match your account.",
          code: ApiErrorCode.VALIDATION_FAILED,
        },
        400
      );
    }

    await prisma.user.delete({ where: { id: auth.user.id } });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return problemUnexpected(err, "DELETE /api/user");
  }
}
