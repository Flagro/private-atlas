import type { VisitWithRelations } from "@/types";

/** Paginated `/api/visits` envelope */
export type VisitsMeta = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type VisitsListPayload = {
  visits: VisitWithRelations[];
  meta: VisitsMeta;
};
