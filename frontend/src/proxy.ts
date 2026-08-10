import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
};

export function proxy(request: NextRequest) {
  const token = request.cookies.get("authToken")?.value;
  const userCookie = request.cookies.get("authUser")?.value;

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isSuperAdminRoute = request.nextUrl.pathname.startsWith("/admin/superadmin") ||
                            request.nextUrl.pathname.startsWith("/admin/admins");

  if (isAdminRoute) {
    if (!token || !userCookie) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    try {
      const user = JSON.parse(userCookie);

      if (isSuperAdminRoute && user.role !== ROLES.SUPERADMIN) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }

      if (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPERADMIN) {
        if (user.role === ROLES.CUSTOMER) {
          return NextResponse.redirect(new URL("/profile", request.url));
        }
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
