import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { ApiErrorCode, problemUnexpected } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

const visitInclude = {
  country: { select: { id: true, name: true, code: true } },
  city: { select: { id: true, name: true, lat: true, lng: true } },
} as const;

function csvEscape(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  const s = String(value).replace(/"/g, '""');
  if (/[,"\n\r]/.test(s)) return `"${s}"`;
  return s;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format")?.toLowerCase() ?? "json";
    if (format !== "json" && format !== "csv") {
      return NextResponse.json(
        {
          error: {
            message: "Query parameter format must be json or csv.",
            code: ApiErrorCode.VALIDATION_FAILED,
          },
        },
        { status: 400 }
      );
    }

    const visits = await prisma.visit.findMany({
      where: { userId: auth.user.id },
      include: visitInclude,
      orderBy: [{ visitedAt: "desc" }, { id: "desc" }],
    });

    if (format === "json") {
      const payload = visits.map((v) => ({
        id: v.id,
        visitedAt: v.visitedAt.toISOString(),
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
        notes: v.notes,
        country: v.country
          ? { code: v.country.code, name: v.country.name }
          : null,
        city: v.city
          ? { name: v.city.name, lat: v.city.lat, lng: v.city.lng }
          : null,
      }));

      const body = JSON.stringify({ exportedAt: new Date().toISOString(), visits: payload }, null, 2);

      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="private-atlas-visits.json"`,
        },
      });
    }

    const header = [
      "id",
      "visited_at",
      "country_code",
      "country_name",
      "city_name",
      "lat",
      "lng",
      "notes",
      "created_at",
    ].join(",");

    const lines = visits.map((v) =>
      [
        csvEscape(v.id),
        csvEscape(v.visitedAt.toISOString()),
        csvEscape(v.country?.code ?? ""),
        csvEscape(v.country?.name ?? ""),
        csvEscape(v.city?.name ?? ""),
        v.city?.lat ?? "",
        v.city?.lng ?? "",
        csvEscape(v.notes),
        csvEscape(v.createdAt.toISOString()),
      ].join(",")
    );

    const csv = [header, ...lines].join("\r\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="private-atlas-visits.csv"`,
      },
    });
  } catch (err) {
    return problemUnexpected(err, "GET /api/visits/export");
  }
}
