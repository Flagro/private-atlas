import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { hashResetToken } from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/validations/auth";
import {
  ApiErrorCode,
  problemResponse,
  problemUnexpected,
} from "@/lib/api-errors";
import { withApiLogging } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function postResetPassword(request: Request) {
  try {
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

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(
        {
          message: "Invalid reset request.",
          code: ApiErrorCode.VALIDATION_FAILED,
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const tokenHash = hashResetToken(parsed.data.token);
    const record = await prisma.passwordResetToken.findFirst({
      where: { tokenHash },
      include: { user: { select: { id: true, passwordHash: true } } },
    });

    if (!record || record.expiresAt < new Date()) {
      return problemResponse(
        {
          message: "This reset link is invalid or has expired.",
          code: ApiErrorCode.VALIDATION_FAILED,
        },
        400
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    return NextResponse.json({ message: "Password updated. You can sign in now." });
  } catch (err) {
    return problemUnexpected(err, "POST /api/auth/reset-password");
  }
}

export const POST = withApiLogging(
  "POST /api/auth/reset-password",
  postResetPassword
);
