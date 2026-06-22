import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import {
  ApiErrorCode,
  problemResponse,
  problemUnexpected,
} from "@/lib/api-errors";
import {
  buildResetPasswordUrl,
  createPasswordResetToken,
} from "@/lib/password-reset";
import { withApiLogging } from "@/lib/logger";

export const dynamic = "force-dynamic";

const GENERIC_MESSAGE =
  "If an account with that email exists and uses a password, you will receive reset instructions.";

async function postForgotPassword(request: Request) {
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

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(
        {
          message: "Invalid email.",
          code: ApiErrorCode.VALIDATION_FAILED,
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    let devResetUrl: string | undefined;

    if (user) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      const { token, tokenHash, expiresAt } = createPasswordResetToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const resetUrl = buildResetPasswordUrl(token);

      if (process.env.NODE_ENV === "development") {
        devResetUrl = resetUrl;
        console.info("[auth] Password reset link (development):", resetUrl);
      } else {
        console.info("[auth] Password reset requested for", email);
      }
    }

    return NextResponse.json({
      message: GENERIC_MESSAGE,
      ...(devResetUrl ? { devResetUrl } : {}),
    });
  } catch (err) {
    return problemUnexpected(err, "POST /api/auth/forgot-password");
  }
}

export const POST = withApiLogging(
  "POST /api/auth/forgot-password",
  postForgotPassword
);
