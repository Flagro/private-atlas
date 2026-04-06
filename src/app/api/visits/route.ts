import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  getVisitsWithRelations,
  createVisit,
  InvalidVisitPlaceError,
} from "@/features/visits";
import { createVisitSchema } from "@/lib/validations/visits";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const countryId = searchParams.get("countryId") ?? undefined;

  const visits = await getVisitsWithRelations(auth.user.id, countryId);
  return NextResponse.json(visits);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createVisitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const visit = await createVisit(auth.user.id, parsed.data);
    return NextResponse.json(visit, { status: 201 });
  } catch (err) {
    if (err instanceof InvalidVisitPlaceError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
