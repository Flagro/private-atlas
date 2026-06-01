import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  ApiErrorCode,
  problemResponse,
  problemUnexpected,
} from "@/lib/api-errors";
import {
  importMergeModeSchema,
  visitImportFileSchema,
} from "@/lib/validations/visit-import";
import { importVisitsForUser } from "@/features/visits/import-visits";
import { MAX_IMPORT_BODY_BYTES, MAX_IMPORT_VISITS } from "@/constants/visits";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const contentLength = request.headers.get("content-length");
    if (contentLength) {
      const len = Number.parseInt(contentLength, 10);
      if (!Number.isNaN(len) && len > MAX_IMPORT_BODY_BYTES) {
        return problemResponse(
          {
            message: "Import file is too large.",
            code: ApiErrorCode.VALIDATION_FAILED,
          },
          413
        );
      }
    }

    const raw = await request.text();
    if (raw.length > MAX_IMPORT_BODY_BYTES) {
      return problemResponse(
        {
          message: "Import file is too large.",
          code: ApiErrorCode.VALIDATION_FAILED,
        },
        413
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      return problemResponse(
        {
          message: "Request body must be valid JSON.",
          code: ApiErrorCode.INVALID_JSON,
        },
        400
      );
    }

    const validated = visitImportFileSchema.safeParse(parsedJson);
    if (!validated.success) {
      return problemResponse(
        {
          message: "Invalid import file format.",
          code: ApiErrorCode.VALIDATION_FAILED,
          details: validated.error.flatten(),
        },
        400
      );
    }

    if (validated.data.visits.length > MAX_IMPORT_VISITS) {
      return problemResponse(
        {
          message: `Import cannot exceed ${MAX_IMPORT_VISITS} visits per request.`,
          code: ApiErrorCode.VALIDATION_FAILED,
        },
        400
      );
    }

    const { searchParams } = new URL(request.url);
    const dryRun =
      searchParams.get("dryRun") === "1" || searchParams.get("dryRun") === "true";

    const mergeParam = searchParams.get("mergeMode") ?? "add";
    const mergeParsed = importMergeModeSchema.safeParse(mergeParam);
    if (!mergeParsed.success) {
      return problemResponse(
        {
          message: 'Query parameter mergeMode must be "add" or "replace".',
          code: ApiErrorCode.VALIDATION_FAILED,
        },
        400
      );
    }

    const result = await importVisitsForUser(auth.user.id, validated.data.visits, {
      dryRun,
      mergeMode: mergeParsed.data,
    });

    return NextResponse.json(result);
  } catch (err) {
    return problemUnexpected(err, "POST /api/visits/import");
  }
}
