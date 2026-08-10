"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiFolder,
  FiTag,
  FiActivity,
  FiCreditCard,
  FiRefreshCw,
  FiTruck,
  FiDollarSign,
  FiHome,
  FiGift,
  FiFileText,
  FiHelpCircle,
  FiImage,
  FiMail,
  FiList,
  FiMenu,
  FiSettings,
  FiLogOut,
  FiUsers,
  FiLayers,
  FiMessageSquare,
  FiBarChart2,
  FiBell,
  FiShield,
  FiUserCheck,
  FiShoppingBag as FiStore,
  FiHeadphones,
  FiMail as FiNewsletter,
  FiStar,
  FiUserPlus,
  FiLock,
  FiSearch,
  FiChevronRight,
  FiMoon,
  FiSun,
  FiX,
  FiCheck,
  FiMoreVertical,
} from "react-icons/fi";
import { getUser, removeToken } from "@/lib/auth";
import { ROLES, getRoleDisplayName } from "@/lib/rbac";

const sidebarSections = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: FiGrid, permission: "dashboard:view" },
      { label: "Analytics", href: "/admin/analytics", icon: FiBarChart2, permission: "analytics:view" },
      { label: "Notifications", href: "/admin/notifications", icon: FiBell, permission: "dashboard:view" },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: FiShoppingBag, permission: "orders:view" },
      { label: "Products", href: "/admin/products", icon: FiPackage, permission: "products:view" },
      { label: "Variants", href: "/admin/variants", icon: FiLayers, permission: "products:view" },
      { label: "Categories", href: "/admin/categories", icon: FiFolder, permission: "categories:view" },
      { label: "Brands", href: "/admin/brands", icon: FiTag, permission: "products:view" },
      { label: "Collections", href: "/admin/collections", icon: FiStar, permission: "products:view" },
    ],
  },
  {
    title: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers", icon: FiUsers, permission: "customers:view" },
      { label: "Reviews", href: "/admin/reviews", icon: FiMessageSquare, permission: "products:view" },
      { label: "Support", href: "/admin/support", icon: FiHeadphones, permission: "dashboard:view" },
    ],
  },
  {
    title: "Fulfillment",
    items: [
      { label: "Inventory", href: "/admin/inventory", icon: FiActivity, permission: "inventory:view" },
      { label: "Stock", href: "/admin/stock", icon: FiLayers, permission: "inventory:view" },
      { label: "Warehouses", href: "/admin/warehouses", icon: FiHome, permission: "inventory:view" },
      { label: "Shipments", href: "/admin/shipments", icon: FiTruck, permission: "orders:view" },
      { label: "Returns", href: "/admin/returns", icon: FiRefreshCw, permission: "orders:view" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payments", href: "/admin/payments", icon: FiDollarSign, permission: "reports:view" },
      { label: "Refunds", href: "/admin/refunds", icon: FiCreditCard, permission: "orders:view" },
      { label: "Coupons", href: "/admin/coupons", icon: FiGift, permission: "products:view" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Banners", href: "/admin/banners", icon: FiImage, permission: "products:view" },
      { label: "Blogs", href: "/admin/blogs", icon: FiFileText, permission: "dashboard:view" },
      { label: "FAQs", href: "/admin/faqs", icon: FiHelpCircle, permission: "dashboard:view" },
      { label: "Newsletter", href: "/admin/newsletter", icon: FiNewsletter, permission: "dashboard:view" },
      { label: "Menus", href: "/admin/menu", icon: FiMenu, permission: "dashboard:view" },
    ],
  },
  {
    title: "Vendors",
    items: [
      { label: "Vendors", href: "/admin/vendors", icon: FiStore, permission: "vendors:view" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Users & Roles", href: "/admin/users", icon: FiUserCheck, permission: "users:view" },
      { label: "Security", href: "/admin/security", icon: FiShield, permission: "settings:view" },
      { label: "Activity Logs", href: "/admin/logs", icon: FiList, permission: "logs:view" },
      { label: "Settings", href: "/admin/settings", icon: FiSettings, permission: "settings:view" },
    ],
  },
];

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
  const [notifications] = useState([
    { id: 1, text: "New order received", time: "2 min ago" },
    { id: 2, text: "Low stock alert", time: "15 min ago" },
    { id: 3, text: "New user registered", time: "1 hour ago" },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const currentPageTitle = filteredSidebarSections
    .flatMap((s) => s.items)
    .find((item) => item.href === pathname)?.label || "Admin";

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.SUPERADMIN:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case ROLES.ADMIN:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs = [{ label: "Home", href: "/admin/dashboard" }];
    let currentPath = "";
    parts.forEach((part, index) => {
      if (part !== "admin") {
        currentPath += `/${part}`;
        crumbs.push({
          label: part.charAt(0).toUpperCase() + part.slice(1),
          href: currentPath,
        });
      }
    });
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <div
          className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 fixed h-screen z-30 ${
            sidebarOpen ? "w-64" : "w-16"
          }`}
        >
          <div className="flex flex-col h-screen">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <span
                className={`font-bold text-gray-800 dark:text-gray-100 text-lg tracking-tight ${!sidebarOpen && "hidden"}`}
              >
                {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
              </span>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 space-y-6">
              {filteredSidebarSections.map((section) => (
                <div key={section.title}>
                  {sidebarOpen && (
                    <h3 className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                      {section.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                            isActive
                              ? "bg-[#0F766E]/10 text-[#0F766E] font-medium border-r-2 border-[#0F766E]"
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#0F766E]"
                          }`}
                          title={!sidebarOpen ? item.label : undefined}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {isSuperAdmin && (
                <div>
                  {sidebarOpen && (
                    <h3 className="px-4 text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                      Super Admin
                    </h3>
                  )}
                  <div className="space-y-1">
                    <Link
                      href="/admin/superadmin"
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                        pathname?.startsWith("/admin/superadmin")
                          ? "bg-red-50 text-red-600 font-medium border-r-2 border-red-500"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600"
                      }`}
                      title={!sidebarOpen ? "Super Admin Panel" : undefined}
                    >
                      <FiShield className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && <span>Super Admin Panel</span>}
                    </Link>
                    <Link
                      href="/admin/admins"
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                        pathname === "/admin/admins"
                          ? "bg-red-50 text-red-600 font-medium border-r-2 border-red-500"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600"
                      }`}
                      title={!sidebarOpen ? "Manage Admins" : undefined}
                    >
                      <FiUserPlus className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && <span>Manage Admins</span>}
                    </Link>
                  </div>
                </div>
              )}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  removeToken();
                  router.push("/auth/login");
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition w-full"
              >
                <FiLogOut className="w-5 h-5" />
                {sidebarOpen && <span>Logout</span>}
              </button>
            </div>
          </div>
        </div>

        <div className={`flex-1 flex flex-col min-w-0 ${sidebarOpen ? "ml-64" : "ml-16"}`}>
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                <FiMenu className="w-5 h-5" />
              </button>
              <div>
                <nav className="flex items-center gap-2 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center gap-2">
                      {index > 0 && <FiChevronRight className="w-4 h-4 text-gray-400" />}
                      {index === breadcrumbs.length - 1 ? (
                        <span className="font-medium text-gray-800 dark:text-gray-100">{crumb.label}</span>
                      ) : (
                        <Link href={crumb.href} className="text-gray-500 dark:text-gray-400 hover:text-[#0F766E]">
                          {crumb.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{currentPageTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              </button>

              <div className="relative hidden sm:block">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  <FiSearch className="w-5 h-5" />
                </button>
                {searchOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  <FiBell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <p className="text-sm text-gray-700 dark:text-gray-200">{n.text}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white flex items-center justify-center text-sm font-medium">
                    {currentUser?.first_name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {currentUser?.first_name} {currentUser?.last_name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(currentUser?.role)}`}>
                      {getRoleDisplayName(currentUser?.role)}
                    </span>
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50">
                    <Link href="/admin/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                      Profile
                    </Link>
                    <Link href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                      Settings
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                    <button
                      onClick={() => {
                        removeToken();
                        router.push("/auth/login");
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}
