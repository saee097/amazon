"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Bell,
  Search,
  Sun,
  Moon,
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
  Sliders,
  LogIn,
  ChevronsLeft,
  ChevronsRight,
  X,
  Activity,
  Store,
} from "lucide-react";
import { getUser, removeToken } from "@/lib/auth";
import { ROLES, getRoleDisplayName } from "@/lib/rbac";

const sidebarSections = [
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
      { label: "Brands", href: "/admin/brands", icon: Tag, permission: "products:view" },
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

const navItemsFlat = sidebarSections.flatMap((s) => s.items);

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const notifications = [
    { id: 1, icon: Truck, text: "New order #45821 received", time: "2 min ago", tone: "bg-emerald-50 text-emerald-700" },
    { id: 2, icon: Boxes, text: "Low stock: Vintage Tee (3 left)", time: "15 min ago", tone: "bg-amber-50 text-amber-700" },
    { id: 3, icon: UserPlus, text: "New customer registered", time: "1 hour ago", tone: "bg-sky-50 text-sky-700" },
    { id: 4, icon: CreditCard, text: "Refund processed for #45789", time: "3 hours ago", tone: "bg-violet-50 text-violet-700" },
  ];

  useEffect(() => {
    const user = getUser();
    const token = getToken();
    if (!token || !user || (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPERADMIN)) {
      removeToken();
      router.push("/auth/login");
      return;
    }
    setCurrentUser(user);
    setLoading(false);

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, [router]);

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  }, []);

  const isSuperAdmin = currentUser?.role === ROLES.SUPERADMIN;

  const filteredSidebarSections = sidebarSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (isSuperAdmin) return true;
      return item.permission && currentUser?.permissions?.includes(item.permission);
    }),
  }));

  const searchResults = searchQuery.trim()
    ? navItemsFlat.filter((i) => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#0F766E] border-t-transparent" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Loading workspace…</p>
        </div>
      </div>
    );
  }

  const currentPageTitle =
    navItemsFlat.find((item) => pathname === item.href || pathname?.startsWith(item.href + "/"))?.label || "Admin";

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.SUPERADMIN:
        return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
      case ROLES.ADMIN:
        return "bg-violet-100 text-violet-700 ring-1 ring-violet-200";
      default:
        return "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
    }
  };

  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs = [{ label: "Home", href: "/admin/dashboard" }];
    let currentPath = "";
    parts.forEach((part) => {
      if (part !== "admin") {
        currentPath += `/${part}`;
        crumbs.push({ label: part.charAt(0).toUpperCase() + part.slice(1), href: currentPath });
      }
    });
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const logout = () => {
    removeToken();
    router.push("/auth/login");
  };

  const SidebarContent = () => (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
        <Link href="/admin/dashboard" className={`flex items-center gap-2 ${!sidebarOpen && "justify-center"}`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F766E] to-[#0d5e58] text-white shadow-sm">
            <Activity size={18} />
          </span>
          {sidebarOpen && (
            <div className="leading-tight">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Amazon Admin</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#0F766E]">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </p>
            </div>
          )}
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 lg:block"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {filteredSidebarSections.map((section) =>
          section.items.length > 0 ? (
            <div key={section.title} className="mb-5">
              {sidebarOpen && (
                <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {section.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-[#0F766E]/10 text-[#0F766E]"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                      } ${!sidebarOpen && "justify-center"}`}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[#0F766E]" />
                      )}
                      <Icon size={18} className="shrink-0" />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null
        )}

        {isSuperAdmin && (
          <div className="mb-5">
            {sidebarOpen && (
              <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-rose-500">
                Super Admin
              </h3>
            )}
            <div className="space-y-0.5">
              <Link
                href="/admin/superadmin"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname?.startsWith("/admin/superadmin")
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20"
                    : "text-gray-600 hover:bg-rose-50 hover:text-rose-700 dark:text-gray-300"
                } ${!sidebarOpen && "justify-center"}`}
              >
                <ShieldAlert size={18} className="shrink-0" />
                {sidebarOpen && <span>Super Panel</span>}
              </Link>
              <Link
                href="/admin/admins"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/admin/admins"
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20"
                    : "text-gray-600 hover:bg-rose-50 hover:text-rose-700 dark:text-gray-300"
                } ${!sidebarOpen && "justify-center"}`}
              >
                <UserPlus size={18} className="shrink-0" />
                {sidebarOpen && <span>Manage Admins</span>}
              </Link>
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"
        >
          <LogOut size={18} className="shrink-0" />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-72 bg-white shadow-xl dark:bg-gray-900">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className={`fixed left-0 top-0 z-30 hidden h-screen border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 lg:block ${
            sidebarOpen ? "w-64" : "w-[72px]"
          }`}
        >
          <SidebarContent />
        </aside>

        <div className={`flex min-h-screen w-full flex-1 flex-col transition-all duration-300 ${sidebarOpen ? "lg:pl-64" : "lg:pl-[72px]"}`}>
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90 sm:px-6"
                  style={{ marginLeft: 0 }}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <div>
                <nav className="flex items-center gap-1.5 text-xs text-gray-500">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={crumb.href} className="flex items-center gap-1.5">
                      {index > 0 && <ChevronRight size={12} className="text-gray-400" />}
                      {index === breadcrumbs.length - 1 ? (
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{crumb.label}</span>
                      ) : (
                        <Link href={crumb.href} className="hover:text-[#0F766E]">
                          {crumb.label}
                        </Link>
                      )}
                    </span>
                  ))}
                </nav>
                <h1 className="mt-0.5 text-lg font-bold text-gray-900 dark:text-gray-100">{currentPageTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <div ref={searchRef} className="relative">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>
                {searchOpen && (
                  <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 p-3 dark:border-gray-700">
                      <input
                        type="text"
                        placeholder="Search admin pages…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700"
                        autoFocus
                      />
                    </div>
                    <ul className="max-h-64 overflow-y-auto p-1">
                      {searchResults.length === 0 ? (
                        <li className="px-3 py-6 text-center text-sm text-gray-500">Type to search pages</li>
                      ) : (
                        searchResults.map((item) => {
                          const Icon = item.icon;
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => {
                                  setSearchOpen(false);
                                  setSearchQuery("");
                                }}
                                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                              >
                                <Icon size={15} className="text-[#0F766E]" />
                                {item.label}
                              </Link>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                  </span>
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                        {notifications.length} new
                      </span>
                    </div>
                    <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700">
                      {notifications.map((n) => {
                        const Icon = n.icon;
                        return (
                          <li
                            key={n.id}
                            className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${n.tone}`}>
                              <Icon size={16} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-800 dark:text-gray-200">{n.text}</p>
                              <p className="mt-0.5 text-xs text-gray-500">{n.time}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="border-t border-gray-200 px-4 py-2 text-center dark:border-gray-700">
                      <Link
                        href="/admin/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs font-medium text-[#0F766E] hover:underline"
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0F766E] to-[#0d5e58] text-sm font-semibold text-white">
                    {currentUser?.first_name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">
                      {currentUser?.first_name} {currentUser?.last_name}
                    </p>
                    <span
                      className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${getRoleBadgeColor(
                        currentUser?.role
                      )}`}
                    >
                      {getRoleDisplayName(currentUser?.role)}
                    </span>
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {currentUser?.first_name} {currentUser?.last_name}
                      </p>
                      <p className="truncate text-xs text-gray-500">{currentUser?.email}</p>
                    </div>
                    <Link
                      href="/admin/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <UserPlus size={14} /> Profile
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <Settings size={14} /> Settings
                    </Link>
                    <Link
                      href="/admin/security"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <ShieldCheck size={14} /> Security
                    </Link>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

          <footer className="border-t border-gray-200 bg-white px-6 py-4 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p>© {new Date().getFullYear()} Amazon Admin · Built for production</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  All systems operational
                </span>
                <span>v1.0.0</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}