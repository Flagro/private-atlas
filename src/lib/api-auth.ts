import { auth } from "@/auth";
import { NextResponse } from "next/server";

type AuthenticatedUser = { id: string; email: string; name?: string | null };

export async function requireAuth(): Promise<
  | { user: AuthenticatedUser; errorResponse: null }
  | { user: null; errorResponse: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user: session.user as AuthenticatedUser, errorResponse: null };
}
