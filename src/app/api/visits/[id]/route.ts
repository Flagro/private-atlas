import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  updateVisit,
  deleteVisit,
  InvalidVisitPlaceError,
} from "@/features/visits";
import { updateVisitSchema } from "@/lib/validations/visits";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateVisitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const visit = await updateVisit(id, auth.user.id, parsed.data);
    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }
    return NextResponse.json(visit);
  } catch (err) {
    if (err instanceof InvalidVisitPlaceError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const deleted = await deleteVisit(id, auth.user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
