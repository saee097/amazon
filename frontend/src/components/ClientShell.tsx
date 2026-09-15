"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiMenu, FiX, FiLogIn, FiInstagram, FiFacebook, FiTwitter, FiMail } from "react-icons/fi";
import { getUser, getToken, removeToken } from "@/lib/auth";
import { ThemeToggleButton } from "@/components/ThemeProvider";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isAuthRoute = pathname?.startsWith("/auth");
  const showNavbar = !isAdminRoute && !isAuthRoute;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<null | string>(null);

  useEffect(() => {
    const user = getUser();
    const token = getToken();
    setIsLoggedIn(!!token && !!user);
    setUserRole(user?.role || null);
  }, [pathname]);

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setUserRole(null);
    window.location.href = "/auth/login";
  };

  const getProfileLink = () => {
    if (userRole === "superadmin") return "/admin/superadmin";
    if (userRole === "admin") return "/admin/dashboard";
    return "/profile";
  };

  return (
    <>
      {showNavbar && (
        <>
          {/* Top Bar */}
          <div className="bg-[#0F766E] text-white text-xs">
            <div className="container mx-auto px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span>Need Help? +92 300 1234567</span>
                <span className="hidden sm:inline">|</span>
                <span className="hidden sm:inline">Free Shipping on orders over $50</span>
              </div>
              <div className="flex items-center gap-4">
                {isLoggedIn ? (
                  <>
                    <Link href={getProfileLink()} className="hover:text-teal-100">Account</Link>
                    <span>|</span>
                    <button onClick={handleLogout} className="hover:text-teal-100">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="hover:text-teal-100">Sign In</Link>
                    <span>|</span>
                    <Link href="/auth/register" className="hover:text-teal-100">Register</Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Header */}
          <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 ">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="lg:hidden p-2 -ml-2 text-gray-700 hover:text-[#0F766E] dark:text-gray-300 dark:hover:text-[#0F766E]"
                >
                  {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                </button>

                {/* Logo */}
                <Link href="/" className="flex-shrink-0">
                  <span className="text-xl font-bold tracking-wider text-gray-900 dark:text-gray-100">STORE</span>
                </Link>

                {/* Desktop Search */}
                <div className="hidden md:flex flex-1 max-w-xl mx-8">
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="Search for products..."
                      className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                  </div>
                </div>

                {/* Icons */}
                <div className="flex items-center gap-6">
                  <Link href="/wishlist" className="hidden sm:flex flex-col items-center text-gray-600 hover:text-[#0F766E] dark:text-gray-400 dark:hover:text-[#0F766E]">
                    <FiHeart size={20} />
                    <span className="text-[10px] mt-1">Wishlist</span>
                  </Link>
                  <Link href="/cart" className="hidden sm:flex flex-col items-center text-gray-600 hover:text-[#0F766E] dark:text-gray-400 dark:hover:text-[#0F766E]">
                    <FiShoppingBag size={20} />
                    <span className="text-[10px] mt-1">Cart</span>
                  </Link>
                  {isLoggedIn ? (
                    <Link href={getProfileLink()} className="hidden sm:flex flex-col items-center text-gray-600 hover:text-[#0F766E] dark:text-gray-400 dark:hover:text-[#0F766E]">
                      <FiUser size={20} />
                      <span className="text-[10px] mt-1">Account</span>
                    </Link>
                  ) : (
                    <Link href="/auth/login" className="hidden sm:flex flex-col items-center text-gray-600 hover:text-[#0F766E] dark:text-gray-400 dark:hover:text-[#0F766E]">
                      <FiLogIn size={20} />
                      <span className="text-[10px] mt-1">Sign In</span>
                    </Link>
                  )}
                  <ThemeToggleButton className="sm:ml-2" />
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:block border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="container mx-auto px-4">
                <div className="flex items-center gap-8 h-10 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Link href="/" className="hover:text-[#0F766E] dark:hover:text-[#0F766E]">Home</Link>
                  <Link href="/products" className="hover:text-[#0F766E] dark:hover:text-[#0F766E]">Shop All</Link>
                  <Link href="/products?category=new" className="hover:text-[#0F766E] dark:hover:text-[#0F766E]">New Arrivals</Link>
                  <Link href="/products?category=sale" className="hover:text-[#0F766E] dark:hover:text-red-500">Sale</Link>
                  <Link href="/products?category=women" className="hover:text-[#0F766E] dark:hover:text-[#0F766E]">Women</Link>
                  <Link href="/products?category=men" className="hover:text-[#0F766E] dark:hover:text-[#0F766E]">Men</Link>
                  <Link href="/products?category=accessories" className="hover:text-[#0F766E] dark:hover:text-[#0F766E]">Accessories</Link>
                </div>
              </div>
            </nav>
          </header>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <div className="container mx-auto px-4 py-4 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                </div>
                <div className="space-y-3 text-sm font-medium">
                  <Link href="/" className="block py-2 border-b border-gray-200 dark:border-gray-800" onClick={() => setMobileOpen(false)}>Home</Link>
                  <Link href="/products" className="block py-2 border-b border-gray-200 dark:border-gray-800" onClick={() => setMobileOpen(false)}>Shop All</Link>
                  <Link href="/products?category=new" className="block py-2 border-b border-gray-200 dark:border-gray-800" onClick={() => setMobileOpen(false)}>New Arrivals</Link>
                  <Link href="/products?category=sale" className="block py-2 border-b border-gray-200 dark:border-gray-800 text-red-600" onClick={() => setMobileOpen(false)}>Sale</Link>
                  <Link href="/products?category=women" className="block py-2 border-b border-gray-200 dark:border-gray-800" onClick={() => setMobileOpen(false)}>Women</Link>
                  <Link href="/products?category=men" className="block py-2 border-b border-gray-200 dark:border-gray-800" onClick={() => setMobileOpen(false)}>Men</Link>
                  <Link href="/products?category=accessories" className="block py-2 border-b border-gray-200 dark:border-gray-800" onClick={() => setMobileOpen(false)}>Accessories</Link>
                  <Link href="/wishlist" className="block py-2 border-b border-gray-200 dark:border-gray-800" onClick={() => setMobileOpen(false)}>Wishlist</Link>
                  <Link href="/cart" className="block py-2 border-b border-gray-200 dark:border-gray-800" onClick={() => setMobileOpen(false)}>Cart</Link>
                  {isLoggedIn ? (
                    <Link href={getProfileLink()} className="block py-2 border-b border-gray-200 dark:border-gray-800" onClick={() => setMobileOpen(false)}>Account</Link>
                  ) : (
                    <Link href="/auth/login" className="block py-2 border-b border-gray-200 dark:border-gray-800" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {showNavbar && (
        <footer className="bg-[#111111] text-white">
          <div className="container mx-auto px-4 pt-16 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
              <div className="lg:col-span-2">
                <Link href="/" className="inline-block mb-4">
                  <span className="text-2xl font-bold tracking-wider text-white">STORE</span>
                </Link>
                <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
                  Your one-stop destination for premium products. We curate the finest selection to elevate your lifestyle with quality and style.
                </p>
                <div className="flex items-center gap-4">
                  <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-[#0F766E] hover:text-white transition-colors">
                    <FiInstagram size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-[#0F766E] hover:text-white transition-colors">
                    <FiFacebook size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-[#0F766E] hover:text-white transition-colors">
                    <FiTwitter size={18} />
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider mb-5 text-white">Shop</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li><Link href="/products?category=new" className="hover:text-[#0F766E] transition-colors">New Arrivals</Link></li>
                  <li><Link href="/products?category=sale" className="hover:text-[#0F766E] transition-colors">Sale</Link></li>
                  <li><Link href="/products?category=women" className="hover:text-[#0F766E] transition-colors">Women</Link></li>
                  <li><Link href="/products?category=men" className="hover:text-[#0F766E] transition-colors">Men</Link></li>
                  <li><Link href="/products?category=accessories" className="hover:text-[#0F766E] transition-colors">Accessories</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider mb-5 text-white">Help</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li><Link href="/contact" className="hover:text-[#0F766E] transition-colors">Contact Us</Link></li>
                  <li><Link href="/shipping" className="hover:text-[#0F766E] transition-colors">Shipping &amp; Returns</Link></li>
                  <li><Link href="/faq" className="hover:text-[#0F766E] transition-colors">FAQ</Link></li>
                  <li><Link href="/size-guide" className="hover:text-[#0F766E] transition-colors">Size Guide</Link></li>
                  <li><Link href="/track-order" className="hover:text-[#0F766E] transition-colors">Track Order</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider mb-5 text-white">Company</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li><Link href="/about" className="hover:text-[#0F766E] transition-colors">About Us</Link></li>
                  <li><Link href="/careers" className="hover:text-[#0F766E] transition-colors">Careers</Link></li>
                  <li><Link href="/stores" className="hover:text-[#0F766E] transition-colors">Store Locator</Link></li>
                  <li><Link href="/privacy" className="hover:text-[#0F766E] transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-[#0F766E] transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 dark:border-gray-700 mt-12 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-500 text-center md:text-left">
                  <p>&copy; 2026 STORE. All rights reserved.</p>
                </div>
                <div className="flex items-center gap-6">
                  <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Privacy</a>
                  <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Terms</a>
                  <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Cookies</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
