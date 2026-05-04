import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { ApiErrorCode, problemResponse } from "@/lib/api-errors";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string | null;
};

/** Discriminated union so callers get a narrowed `user` after `if (!auth.ok)`. */
export type AuthResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      response: problemResponse(
        { message: "Authentication required.", code: ApiErrorCode.UNAUTHORIZED },
        401
      ),
    };
  }
  return { ok: true, user: session.user as AuthenticatedUser };
}
