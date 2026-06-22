import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validations/auth";
import {
  ApiErrorCode,
  problemResponse,
  problemUnexpected,
} from "@/lib/api-errors";
import { withApiLogging } from "@/lib/logger";

async function postRegister(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return problemResponse(
        { message: "Request body must be valid JSON.", code: ApiErrorCode.INVALID_JSON },
        400
      );
    }

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return problemResponse(
        {
          message: "Invalid input.",
          code: ApiErrorCode.VALIDATION_FAILED,
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return problemResponse(
        {
          message: "An account with this email already exists.",
          code: ApiErrorCode.CONFLICT,
        },
        409
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return problemResponse(
        {
          message: "An account with this email already exists.",
          code: ApiErrorCode.CONFLICT,
        },
        409
      );
    }
    return problemUnexpected(error, "POST /api/auth/register");
  }
}

export const POST = withApiLogging("POST /api/auth/register", postRegister);
