import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { changePasswordSchema } from "@/lib/validations/auth";
import {
  ApiErrorCode,
  problemResponse,
  problemUnexpected,
} from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
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

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(
        {
          message: "Invalid password input.",
          code: ApiErrorCode.VALIDATION_FAILED,
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return problemResponse(
        {
          message:
            "This account uses Google sign-in only. Set a password via forgot-password if you added email sign-in later.",
          code: ApiErrorCode.VALIDATION_FAILED,
        },
        400
      );
    }

    const valid = await verifyPassword(
      parsed.data.currentPassword,
      user.passwordHash
    );
    if (!valid) {
      return problemResponse(
        {
          message: "Current password is incorrect.",
          code: ApiErrorCode.UNAUTHORIZED,
        },
        401
      );
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ message: "Password updated." });
  } catch (err) {
    return problemUnexpected(err, "PATCH /api/user/password");
  }
}
