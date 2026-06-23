import { handlers } from "@/auth";
import { withApiLogging } from "@/lib/logger";

export const GET = withApiLogging("GET /api/auth/[...nextauth]", handlers.GET);
export const POST = withApiLogging("POST /api/auth/[...nextauth]", handlers.POST);
