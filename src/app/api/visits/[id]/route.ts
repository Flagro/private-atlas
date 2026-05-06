import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  updateVisit,
  deleteVisit,
  InvalidVisitPlaceError,
} from "@/features/visits";
import { updateVisitSchema } from "@/lib/validations/visits";
import { ApiErrorCode, problemResponse } from "@/lib/api-errors";
import { mapVisitDates } from "@/lib/serialize-visit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return problemResponse(
      { message: "Request body must be valid JSON.", code: ApiErrorCode.INVALID_JSON },
      400
    );
  }

  const parsed = updateVisitSchema.safeParse(body);
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

  try {
    const visit = await updateVisit(id, auth.user.id, parsed.data);
    if (!visit) {
      return problemResponse(
        { message: "Visit not found.", code: ApiErrorCode.NOT_FOUND },
        404
      );
    }
    return NextResponse.json(mapVisitDates(visit));
  } catch (err) {
    if (err instanceof InvalidVisitPlaceError) {
      return problemResponse(
        { message: err.message, code: ApiErrorCode.INVALID_VISIT_PLACE },
        400
      );
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
    return problemResponse(
      { message: "Visit not found.", code: ApiErrorCode.NOT_FOUND },
      404
    );
  }

  return new NextResponse(null, { status: 204 });
}
