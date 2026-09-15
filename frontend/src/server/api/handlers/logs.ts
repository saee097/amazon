import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";
import { requirePermission } from "../../lib/auth";
import { jsonError, jsonData } from "../../lib/response";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const EXPORT_BATCH_SIZE = 1000;
const MAX_EXPORT_ROWS = 10000;
const SENSITIVE_KEYS = new Set([
  "password",
  "passwd",
  "secret",
  "token",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "authorization",
  "cookie",
  "set-cookie",
  "card",
  "cardNumber",
  "card_number",
  "cvv",
  "accountNumber",
  "account_number",
]);

type ProfileRow = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
};

type AuditLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  details: unknown;
  ip_address: string | null;
  user_agent: string | null;
  before: unknown;
  after: unknown;
  result: string | null;
  created_at: string;
  profiles?: ProfileRow | null;
};

type LogFilters = {
  userId?: string;
  action?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
  result?: string;
  search?: string;
};

type ParsedLogsRequest = {
  page: number;
  limit: number;
  filters: LogFilters;
  error?: string;
};

function parsePositiveInteger(value: string | null, fallback: number, maximum: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

function parseDate(value: string | null, name: string) {
  if (!value) return { value: null, error: null };
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const candidate = dateOnly ? `${value}T00:00:00.000Z` : value;
  const timestamp = Date.parse(candidate);
  if (Number.isNaN(timestamp)) {
    return { value: null, error: `${name} must be a valid date` };
  }
  const parsed = new Date(timestamp);
  return {
    value: dateOnly ? `${value}T23:59:59.999Z` : parsed.toISOString(),
    error: null,
  };
}

function parseLogsRequest(request: NextRequest): ParsedLogsRequest {
  const page = parsePositiveInteger(request.nextUrl.searchParams.get("page"), 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePositiveInteger(request.nextUrl.searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);
  const startDateParam = request.nextUrl.searchParams.get("startDate");
  const endDateParam = request.nextUrl.searchParams.get("endDate");
  const startDate = parseDate(startDateParam, "startDate");
  const endDate = parseDate(endDateParam, "endDate");

  if (startDate.error) return { page, limit, filters: {}, error: startDate.error };
  if (endDate.error) return { page, limit, filters: {}, error: endDate.error };
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    return { page, limit, filters: {}, error: "startDate must be before endDate" };
  }

  return {
    page,
    limit,
    filters: {
      userId: request.nextUrl.searchParams.get("user") || undefined,
      action: request.nextUrl.searchParams.get("action") || undefined,
      module: request.nextUrl.searchParams.get("module") || undefined,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined,
      result: request.nextUrl.searchParams.get("result") || undefined,
      search: request.nextUrl.searchParams.get("search") || undefined,
    },
  };
}

function escapeFilterValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/,/g, "\\,").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function applyFilters(query: any, filters: LogFilters) {
  let filtered = query;
  if (filters.userId) filtered = filtered.eq("user_id", filters.userId);
  if (filters.action) filtered = filtered.eq("action", filters.action);
  if (filters.module) filtered = filtered.eq("resource", filters.module);
  if (filters.startDate) filtered = filtered.gte("created_at", filters.startDate);
  if (filters.endDate) filtered = filtered.lte("created_at", filters.endDate);
  if (filters.result) filtered = filtered.eq("result", filters.result);
  if (filters.search) {
    const search = escapeFilterValue(filters.search.trim());
    filtered = filtered.or(`action.ilike.%${search}%,resource.ilike.%${search}%`);
  }
  return filtered;
}

function getLogQuery(supabase: ReturnType<typeof getSupabaseAdmin>, filters: LogFilters, count = false) {
  return applyFilters(
    supabase.from("audit_logs").select("*, profiles(first_name, last_name, email)", {
      count: count ? "exact" : undefined,
      head: false,
    }),
    filters
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function redactSensitiveData(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > 8) return "[Max depth exceeded]";
  if (Array.isArray(value)) return value.map((item) => redactSensitiveData(item, depth + 1, seen));
  if (!isRecord(value)) return value;
  if (seen.has(value)) return "[Circular reference]";
  seen.add(value);
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    output[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : redactSensitiveData(item, depth + 1, seen);
  }
  return output;
}

function displayName(profile: ProfileRow | null | undefined) {
  if (!profile) return "System";
  return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "System";
}

function mapAuditLog(row: AuditLogRow) {
  const details = redactSensitiveData(row.details ?? {});
  const before = row.before === undefined || row.before === null
    ? (isRecord(details) ? details.oldData ?? details.before ?? null : null)
    : redactSensitiveData(row.before);
  const after = row.after === undefined || row.after === null
    ? (isRecord(details) ? details.newData ?? details.after ?? null : null)
    : redactSensitiveData(row.after);
  const profile = row.profiles || null;
  return {
    _id: row.id,
    id: row.id,
    action: row.action,
    module: row.resource || "system",
    resource: row.resource,
    resourceId: row.resource_id,
    result: row.result || "success",
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    userId: row.user_id,
    user: profile ? {
      _id: profile.id,
      id: profile.id,
      name: displayName(profile),
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
    } : null,
    details,
    oldData: before,
    newData: after,
    createdAt: row.created_at,
  };
}

function csvCell(value: unknown) {
  let text = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function csvRow(values: unknown[]) {
  return values.map(csvCell).join(",");
}

function exportHeaders() {
  return [
    "id",
    "action",
    "module",
    "resource_id",
    "result",
    "user_id",
    "user_name",
    "user_email",
    "ip_address",
    "user_agent",
    "details",
    "before",
    "after",
    "created_at",
  ].join(",");
}

function toCsvRow(log: ReturnType<typeof mapAuditLog>) {
  return csvRow([
    log.id,
    log.action,
    log.module,
    log.resourceId,
    log.result,
    log.userId,
    log.user?.name,
    log.user?.email,
    log.ipAddress,
    log.userAgent,
    log.details,
    log.oldData,
    log.newData,
    log.createdAt,
  ]);
}

export async function handleLogs(method: string, path: string[], request: NextRequest) {
  if (method !== "GET") return jsonError("Method not allowed", 405);

  const isExport = path[1] === "export";
  const { user, error: authError } = await requirePermission(request, isExport ? "logs:export" : "logs:view");
  if (authError) return authError;
  if (!user) return jsonError("Unauthorized", 401);
  if (path.length > 2 && !isExport) return jsonError("Not found", 404);

  const parsed = parseLogsRequest(request);
  if (parsed.error) return jsonError(parsed.error, 400);

  const supabase = getSupabaseAdmin();
  const filters = parsed.filters;

  if (isExport) {
    const countQuery = applyFilters(
      supabase.from("audit_logs").select("id", { count: "exact", head: true }),
      filters
    );
    const { count, error: countError } = await countQuery;
    if (countError) return jsonError(countError.message || "Unable to export logs", 500);
    if ((count || 0) > MAX_EXPORT_ROWS) {
      return jsonError(`Export is limited to ${MAX_EXPORT_ROWS} rows. Narrow your filters.`, 400);
    }

    const encoder = new TextEncoder();
    let offset = 0;
    let firstChunk = true;
    let finished = false;
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (finished) {
          controller.close();
          return;
        }
        const { data, error } = await applyFilters(
          supabase.from("audit_logs").select("*, profiles(first_name, last_name, email)"),
          filters
        )
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + EXPORT_BATCH_SIZE - 1);
        if (error) {
          controller.error(new Error(error.message || "Unable to export logs"));
          finished = true;
          return;
        }
        const rows = (data || []) as AuditLogRow[];
        const chunk = `${firstChunk ? `${exportHeaders()}\r\n` : ""}${rows.map((row) => toCsvRow(mapAuditLog(row))).join("\r\n")}${rows.length ? "\r\n" : ""}`;
        controller.enqueue(encoder.encode(chunk));
        firstChunk = false;
        offset += rows.length;
        if (rows.length < EXPORT_BATCH_SIZE) finished = true;
      },
    });

    const date = new Date().toISOString().slice(0, 10);
    return new Response(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="audit-logs-${date}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const from = (parsed.page - 1) * parsed.limit;
  const { data, count, error } = await getLogQuery(supabase, filters, true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + parsed.limit - 1);
  if (error) return jsonError(error.message || "Unable to load logs", 500);

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / parsed.limit));
  return jsonData((data || []).map(mapAuditLog), {
    count: total,
    page: parsed.page,
    limit: parsed.limit,
    totalPages,
    pagination: { page: parsed.page, limit: parsed.limit, total, totalPages },
  });
}
