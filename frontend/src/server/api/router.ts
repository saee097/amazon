import { NextRequest } from "next/server";
import { handleAuth } from "./handlers/auth";
import { handleStore } from "./handlers/store";
import { handleProducts } from "./handlers/products";
import { handleAdmin } from "./handlers/admin";
import { handleDashboard } from "./handlers/dashboard";
import { getResourceTable, handleResource } from "./handlers/resources";
import { jsonError } from "../lib/response";

export async function routeRequest(request: NextRequest, path: string[]) {
  const method = request.method;

  if (path[0] === "auth") {
    return handleAuth(method, path, request);
  }

  if (path[0] === "store") {
    return handleStore(method, path, request);
  }

  if (path[0] === "dashboard") {
    return handleDashboard(method, path, request);
  }

  if (path[0] === "admin") {
    const endpoint = `/${path.slice(0, 2).join("/")}`;
    const resourceTable = getResourceTable(endpoint);

    if (resourceTable && !["users", "orders", "products", "categories", "settings", "logs", "roles", "permissions", "inventory", "stock", "shipments", "customers", "system"].includes(path[1])) {
      return handleResource(method, endpoint, path[2], request);
    }

    return handleAdmin(method, path, request);
  }

  const catalogRoutes = ["categories", "brands", "banners", "menu-items", "warehouses", "coupons", "addresses", "returns", "products"];
  if (catalogRoutes.includes(path[0])) {
    return handleProducts(method, path, request);
  }

  return jsonError(`Route not found: /${path.join("/")}`, 404);
}
