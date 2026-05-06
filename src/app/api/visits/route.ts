import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  createVisit,
  findVisitsPage,
  InvalidVisitPlaceError,
} from "@/features/visits";
import { createVisitSchema } from "@/lib/validations/visits";
import {
  ApiErrorCode,
  problemResponse,
} from "@/lib/api-errors";
import { DEFAULT_VISIT_PAGE_SIZE, MAX_VISIT_PAGE_SIZE } from "@/constants/visits";
import { mapVisitDates } from "@/lib/serialize-visit";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const countryId = searchParams.get("countryId")?.trim() || undefined;

  let limit =
    Number.parseInt(searchParams.get("limit") ?? `${DEFAULT_VISIT_PAGE_SIZE}`, 10);
  let offset =
    Number.parseInt(searchParams.get("offset") ?? "0", 10);
  if (Number.isNaN(limit))
    limit = DEFAULT_VISIT_PAGE_SIZE;
  if (Number.isNaN(offset))
    offset = 0;
  limit = Math.min(Math.max(limit, 1), MAX_VISIT_PAGE_SIZE);
  offset = Math.max(offset, 0);

  const page = await findVisitsPage(auth.user.id, {
    countryId,
    limit,
    offset,
  });

  return NextResponse.json({
    visits: page.visits.map(mapVisitDates),
    meta: {
      total: page.total,
      limit: page.limit,
      offset: page.offset,
      hasMore: page.hasMore,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body) {
    return problemResponse(
      { message: "Request body must be valid JSON.", code: ApiErrorCode.INVALID_JSON },
      400
    );
  }

  const parsed = createVisitSchema.safeParse(body);
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
    const visit = await createVisit(auth.user.id, parsed.data);
    return NextResponse.json(mapVisitDates(visit), { status: 201 });
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
