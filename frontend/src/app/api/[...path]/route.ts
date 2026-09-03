import { NextRequest } from "next/server";
import { routeRequest } from "@/server/api/router";
import { jsonError } from "@/server/lib/response";

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, context: RouteContext) {
  try {
    const { path } = await context.params;
    return await routeRequest(request, path);
  } catch (error) {
    console.error("API Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "Internal server error";
    return jsonError(message, 500);
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
