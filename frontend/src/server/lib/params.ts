import { NextRequest } from "next/server";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  maximum: number
): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number } = {},
  maxLimit = MAX_LIMIT
): ParsedPagination {
  const page = parsePositiveInteger(
    searchParams.get("page"),
    defaults.page ?? DEFAULT_PAGE,
    Number.MAX_SAFE_INTEGER
  );
  const limit = parsePositiveInteger(
    searchParams.get("limit"),
    defaults.limit ?? DEFAULT_LIMIT,
    maxLimit
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export interface SortSpec {
  field: string;
  ascending: boolean;
  column: string;
}

export function parseSort(
  searchParams: URLSearchParams,
  allowedFields: string[],
  defaultField = "created_at",
  defaultAscending = false
): SortSpec {
  const sortParam = searchParams.get("sort") || "";
  const dirParam = (searchParams.get("order") || "").toLowerCase();

  let field = defaultField;
  let ascending = defaultAscending;

  if (sortParam) {
    const cleanSort = sortParam.startsWith("-") ? sortParam.slice(1) : sortParam;
    if (allowedFields.includes(cleanSort)) {
      field = cleanSort;
      ascending = !sortParam.startsWith("-");
    }
  }

  if (dirParam === "asc" || dirParam === "ascending") ascending = true;
  if (dirParam === "desc" || dirParam === "descending") ascending = false;

  return {
    field,
    ascending,
    column: `${ascending ? "" : "-"}${field}`,
  };
}

export function parsePriceRange(
  searchParams: URLSearchParams
): { min?: number; max?: number } {
  const min = parseFloat(searchParams.get("min_price") || "");
  const max = parseFloat(searchParams.get("max_price") || "");
  return {
    min: !isNaN(min) && min >= 0 ? min : undefined,
    max: !isNaN(max) && max >= 0 ? max : undefined,
  };
}

export function buildPaginationMeta(meta: PaginationMeta): PaginationMeta {
  return meta;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  inStock?: string;
  sizes?: string;
  colors?: string;
  page: number;
  limit: number;
  skip: number;
}

export function parseProductFilters(
  searchParams: URLSearchParams
): ProductFilters {
  const pagination = parsePagination(searchParams);
  const price = parsePriceRange(searchParams);
  const sort = parseSort(searchParams, [
    "price",
    "title",
    "created_at",
    "updated_at",
  ]);

  return {
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    brand: searchParams.get("brand") || undefined,
    minPrice: price.min,
    maxPrice: price.max,
    sort: sort.column,
    inStock: searchParams.get("in_stock") || undefined,
    sizes: searchParams.get("sizes") || undefined,
    colors: searchParams.get("colors") || undefined,
    page: pagination.page,
    limit: pagination.limit,
    skip: pagination.skip,
  };
}

export function getRequestPagination(
  request: NextRequest
): ParsedPagination & { searchParams: URLSearchParams } {
  const searchParams = request.nextUrl.searchParams;
  const pagination = parsePagination(searchParams);
  return { ...pagination, searchParams };
}

export { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT };
