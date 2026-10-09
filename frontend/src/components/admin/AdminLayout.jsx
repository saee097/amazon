"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Bell,
  Search,
  ChevronRight,
  Menu,
  LogOut,
  Settings,
  ShieldCheck,
  UserPlus,
  Package,
  Layers,
  FolderTree,
  Tag,
  Star,
  Users,
  MessageSquare,
  Headphones,
  Boxes,
  Warehouse,
  Truck,
  RefreshCw,
  Wallet,
  CreditCard,
  Gift,
  ImageIcon,
  FileText,
  HelpCircle,
  Mail,
  ListTree,
  ShieldAlert,
  ScrollText,
  ChevronsLeft,
  ChevronsRight,
  X,
  Activity,
  Store,
  User,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { getUser, removeToken } from "@/lib/auth";
import { ROLES, getRoleDisplayName } from "@/lib/rbac";
import api from "@/lib/api";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeToggleButton } from "@/components/ThemeProvider";

// ─── Sidebar navigation sections ─────────────────────────────────────────────
const SIDEBAR_SECTIONS = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3, permission: "analytics:view" },
      { label: "Notifications", href: "/admin/notifications", icon: Bell, permission: "dashboard:view" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package, permission: "products:view" },
      { label: "Variants", href: "/admin/variants", icon: Layers, permission: "products:view" },
      { label: "Categories", href: "/admin/categories", icon: FolderTree, permission: "categories:view" },
      { label: "Brands", href: "/admin/brands", icon: Tag, permission: "brands:view" },
      { label: "Collections", href: "/admin/collections", icon: Star, permission: "products:view" },
    ],
  },
  {
    title: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers", icon: Users, permission: "customers:view" },
      { label: "Reviews", href: "/admin/reviews", icon: MessageSquare, permission: "products:view" },
      { label: "Support", href: "/admin/support", icon: Headphones, permission: "dashboard:view" },
    ],
  },
  {
    title: "Sales & Orders",
    items: [
      { label: "Orders", href: "/admin/orders", icon: Truck, permission: "orders:view" },
      { label: "Shipments", href: "/admin/shipments", icon: Truck, permission: "orders:view" },
      { label: "Returns", href: "/admin/returns", icon: RefreshCw, permission: "orders:view" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Inventory", href: "/admin/inventory", icon: Boxes, permission: "inventory:view" },
      { label: "Stock", href: "/admin/stock", icon: Layers, permission: "inventory:view" },
      { label: "Warehouses", href: "/admin/warehouses", icon: Warehouse, permission: "inventory:view" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payments", href: "/admin/payments", icon: Wallet, permission: "reports:view" },
      { label: "Refunds", href: "/admin/refunds", icon: CreditCard, permission: "orders:view" },
      { label: "Coupons", href: "/admin/coupons", icon: Gift, permission: "products:view" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Banners", href: "/admin/banners", icon: ImageIcon, permission: "products:view" },
      { label: "Blogs", href: "/admin/blogs", icon: FileText, permission: "dashboard:view" },
      { label: "FAQs", href: "/admin/faqs", icon: HelpCircle, permission: "dashboard:view" },
      { label: "Newsletter", href: "/admin/newsletter", icon: Mail, permission: "dashboard:view" },
      { label: "Menus", href: "/admin/menu", icon: ListTree, permission: "dashboard:view" },
    ],
  },
  {
    title: "Vendors",
    items: [
      { label: "Vendors", href: "/admin/vendors", icon: Store, permission: "vendors:view" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Users & Roles", href: "/admin/users", icon: ShieldCheck, permission: "users:view" },
      { label: "Security", href: "/admin/security", icon: ShieldAlert, permission: "settings:view" },
      { label: "Activity Logs", href: "/admin/logs", icon: ScrollText, permission: "logs:view" },
      { label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings:view" },
    ],
  },
];

const ALL_NAV_ITEMS = SIDEBAR_SECTIONS.flatMap((s) => s.items);

// ─── Small helpers ─────────────────────────────────────────────────────────
function getInitials(user) {
  if (!user) return "A";
  const first = user.first_name?.[0] || "";
  const last = user.last_name?.[0] || "";
  return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "A";
}

function getRoleBadgeStyle(role) {
  switch (role) {
    case ROLES.SUPERADMIN:
      return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
    case ROLES.ADMIN:
      return "bg-violet-100 text-violet-700 ring-1 ring-violet-200";
    default:
      return "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
  }
}

function NotificationIcon({ type }) {
  switch (type) {
    case "order":
      return <Truck size={14} className="shrink-0" />;
    case "stock":
      return <AlertTriangle size={14} className="shrink-0" />;
    case "user":
      return <UserPlus size={14} className="shrink-0" />;
    case "refund":
      return <CreditCard size={14} className="shrink-0" />;
    default:
      return <Info size={14} className="shrink-0" />;
  }
}

function NotificationTone(type) {
  switch (type) {
    case "order":   return "bg-emerald-50 text-emerald-700";
    case "stock":   return "bg-amber-50 text-amber-700";
    case "user":    return "bg-sky-50 text-sky-700";
    case "refund":  return "bg-violet-50 text-violet-700";
    default:        return "bg-gray-100 text-gray-600";
  }
}

// ─── Sidebar content (shared between desktop + mobile) ────────────────────
function SidebarContent({ collapsed, pathname, isSuperAdmin, currentUser, filteredSections, onClose }) {
  const router = useRouter();

  const logout = () => {
    removeToken();
    if (onClose) onClose();
    router.push("/auth/login");
  };

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Brand */}
      <div
        className={`flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-800 px-4 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <Link href="/admin/dashboard" className={`flex items-center gap-2.5 min-w-0 ${collapsed ? "justify-center" : ""}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F766E] to-[#0d5e58] text-white">
            <Activity size={18} />
          </span>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">Amazon Admin</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#0F766E]">
                {isSuperAdmin ? "Super Admin" : "Admin Panel"}
              </p>
            </div>
          )}
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
        {filteredSections.map((section) =>
          section.items.length > 0 ? (
            <div key={section.title} className="mb-5">
              {!collapsed && (
                <h3 className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {section.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-[#0F766E]/10 text-[#0F766E] dark:bg-[#0F766E]/20"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#0F766E]" />
                      )}
                      <Icon
                        size={17}
                        className={`shrink-0 ${isActive ? "text-[#0F766E]" : ""}`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null
        )}

        {/* Super-admin section */}
        {isSuperAdmin && (
          <div className="mb-5">
            {!collapsed && (
              <h3 className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-rose-400">
                Super Admin
              </h3>
            )}
            <div className="space-y-0.5">
              {[
                { href: "/admin/superadmin", label: "Super Panel", Icon: ShieldAlert },
                { href: "/admin/admins", label: "Manage Admins", Icon: UserPlus },
              ].map(({ href, label, Icon }) => {
                const isActive = pathname === href || pathname?.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20"
                        : "text-gray-600 hover:bg-rose-50 hover:text-rose-700 dark:text-gray-400 dark:hover:bg-rose-900/10 dark:hover:text-rose-400"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon size={17} className="shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 p-3 space-y-1">
        <Link
          href="/admin/profile"
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? `${currentUser?.first_name} ${currentUser?.last_name}` : undefined}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0F766E]/20 to-[#0F766E]/40 text-[#0F766E] text-xs font-bold">
            {getInitials(currentUser)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">
                {currentUser?.first_name || "Admin"}
              </p>
              <p className="truncate text-[10px] text-gray-500">{currentUser?.email}</p>
            </div>
          )}
        </Link>
        <button
          onClick={logout}
          title={collapsed ? "Logout" : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-900/20 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={17} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

// ─── Main AdminLayout ──────────────────────────────────────────────────────
export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem("admin_sidebar_collapsed") === "true"
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser] = useState(() => getUser());

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

  // User menu
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Click-outside handler
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Load live notifications from /admin/notifications
  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const { data } = await api.get("/admin/notifications");
      const rows = (data?.data || []).slice(0, 8).map((n) => ({
        id: n._id,
        title: n.title,
        message: n.message,
        type: n.type || "info",
        time: n.created_at
          ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
              Math.round((new Date(n.created_at) - Date.now()) / 60000),
              "minute"
            )
          : "",
      }));
      setNotifications(rows);
    } catch {
      // fall back to empty
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin_sidebar_collapsed", String(next));
      return next;
    });
  }, []);

  const isSuperAdmin = currentUser?.role === ROLES.SUPERADMIN;

  // Filter sidebar by permissions
  const filteredSections = SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (isSuperAdmin) return true;
      return item.permission && currentUser?.permissions?.includes(item.permission);
    }),
  }));

  // Search results
  const searchResults = searchQuery.trim()
    ? ALL_NAV_ITEMS.filter((i) =>
        i.label.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  // Breadcrumbs
  const breadcrumbs = (() => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs = [{ label: "Home", href: "/admin/dashboard" }];
    let path = "";
    parts.forEach((part) => {
      if (part !== "admin") {
        path += "/" + part;
        crumbs.push({
          label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
          href: path,
        });
      }
    });
    return crumbs;
  })();

  const pageTitle =
    ALL_NAV_ITEMS.find(
      (item) => pathname === item.href || pathname?.startsWith(item.href + "/")
    )?.label || "Admin";

  const logout = () => {
    removeToken();
    router.push("/auth/login");
  };

  const unreadCount = notifications.length;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[min(18rem,88vw)]">
            <SidebarContent
              collapsed={false}
              pathname={pathname}
              isSuperAdmin={isSuperAdmin}
              currentUser={currentUser}
              filteredSections={filteredSections}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`fixed left-0 top-0 z-30 hidden h-screen border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:block ${
          collapsed ? "w-[70px]" : "w-64"
        }`}
      >
        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-20 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-[#0F766E] hover:text-[#0F766E] dark:border-gray-700 dark:bg-gray-900 lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight size={13} /> : <ChevronsLeft size={13} />}
        </button>

        <SidebarContent
          collapsed={collapsed}
          pathname={pathname}
          isSuperAdmin={isSuperAdmin}
          currentUser={currentUser}
          filteredSections={filteredSections}
          onClose={null}
        />
      </aside>

      {/* ── Main content area ── */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "lg:pl-[70px]" : "lg:pl-64"
        }`}
      >
        {/* ── Topbar ── */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90 sm:px-6">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <nav className="hidden items-center gap-1 text-xs text-gray-400 sm:flex">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.href} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight size={11} className="text-gray-300" />}
                    {i === breadcrumbs.length - 1 ? (
                      <span className="font-medium text-gray-700 dark:text-gray-200">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="hover:text-[#0F766E] transition-colors">
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 sm:text-lg leading-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Search */}
            <div ref={searchRef} className="relative">
              <button
                onClick={() => { setSearchOpen((p) => !p); setSearchQuery(""); }}
                className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition"
                aria-label="Search pages"
              >
                <Search size={18} />
              </button>
              {searchOpen && (
                <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <div className="border-b border-gray-200 p-3 dark:border-gray-700">
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search admin pages…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        autoFocus
                      />
                    </div>
                  </div>
                  <ul className="max-h-64 overflow-y-auto p-1.5">
                    {searchQuery.trim() === "" ? (
                      <li className="px-3 py-8 text-center text-sm text-gray-400">
                        Start typing to search pages
                      </li>
                    ) : searchResults.length === 0 ? (
                      <li className="px-3 py-8 text-center text-sm text-gray-400">No pages found</li>
                    ) : (
                      searchResults.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                              <Icon size={16} className="shrink-0 text-[#0F766E]" />
                              {item.label}
                              <ExternalLink size={12} className="ml-auto text-gray-300" />
                            </Link>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            {(currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.SUPERADMIN) && (
              <ThemeToggleButton aria-label="Toggle theme" />
            )}

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => {
                  setNotifOpen((p) => !p);
                  if (!notifOpen) loadNotifications();
                }}
                className="relative rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</p>
                    <Link
                      href="/admin/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-[#0F766E] hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                    {notifLoading ? (
                      <li className="flex items-center justify-center py-10">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0F766E] border-t-transparent" />
                      </li>
                    ) : notifications.length === 0 ? (
                      <li className="py-10 text-center text-sm text-gray-400">No notifications</li>
                    ) : (
                      notifications.map((n) => (
                        <li key={n.id}>
                          <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <span
                              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${NotificationTone(n.type)}`}
                            >
                              <NotificationIcon type={n.type} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* User menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0F766E]/20 to-[#0F766E]/40 text-[#0F766E] text-xs font-bold shrink-0">
                  {getInitials(currentUser)}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-none">
                    {currentUser?.first_name || "Admin"}
                  </p>
                  <span
                    className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${getRoleBadgeStyle(currentUser?.role)}`}
                  >
                    {getRoleDisplayName(currentUser?.role)}
                  </span>
                </div>
                <ChevronDown size={14} className="hidden text-gray-400 sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {currentUser?.first_name} {currentUser?.last_name}
                    </p>
                    <p className="truncate text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                  <ul className="p-1">
                    {[
                      { href: "/admin/profile", label: "My Profile", Icon: User },
                      { href: "/admin/settings", label: "Settings", Icon: Settings },
                      { href: "/admin/security", label: "Security", Icon: ShieldAlert },
                    ].map(({ href, label, Icon }) => (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <Icon size={15} className="shrink-0 text-gray-400" />
                          {label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    </li>
                    <li>
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      >
                        <LogOut size={15} className="shrink-0" />
                        Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="min-w-0 w-full flex-1 p-3 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Amazon Admin. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              All systems operational
            </div>
          </div>
        </footer>
      </div>
    </div>
  </ToastProvider>
);
}
