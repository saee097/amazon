"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  MessageCircle,
  Truck,
  RotateCcw,
  CreditCard,
  Package,
  Ruler,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Clock3,
  CheckCircle2,
  X,
} from "lucide-react";

const faqs = [
  {
    category: "Orders & Shipping",
    icon: Truck,
    description: "Everything about delivery, tracking, and shipping.",
    items: [
      {
        q: "How do I track my order?",
        a: "Once your order has been shipped, you will receive a tracking number through your registered email or phone number. You can also visit our Track Order page and enter your order ID and email address to view the latest status.",
      },
      {
        q: "What shipping methods do you offer?",
        a: "We currently offer Standard, Express, and Overnight delivery depending on your location. Standard delivery typically takes 5–7 business days, while Express delivery usually takes 2–3 business days. Delivery availability and estimated times may vary by location.",
      },
      {
        q: "Do you ship internationally?",
        a: "At the moment, we ship within Pakistan. We are working on expanding our delivery network and may introduce international shipping in the future.",
      },
    ],
  },
  {
    category: "Returns & Exchanges",
    icon: RotateCcw,
    description: "Learn about returns, refunds, and exchanges.",
    items: [
      {
        q: "What is your return policy?",
        a: "We accept eligible returns within 30 days of delivery. Items should be unused, unworn, unwashed, and returned in their original packaging with tags attached. Some products may have additional return restrictions.",
      },
      {
        q: "How do I initiate a return?",
        a: "To start a return, contact our support team with your order number and the reason for your return. Our team will review your request and provide the next steps if the item qualifies for return.",
      },
      {
        q: "Are exchanges free?",
        a: "Eligible size and color exchanges can be requested within the applicable return period. Exchange availability depends on stock, product eligibility, and delivery location.",
      },
    ],
  },
  {
    category: "Products & Sizing",
    icon: Ruler,
    description: "Product information, sizing, authenticity, and more.",
    items: [
      {
        q: "How do I find my size?",
        a: "You can use our Size Guide to compare your measurements with the product sizing information. We recommend checking the specific product page because sizing can vary between products and brands.",
      },
      {
        q: "Are your products authentic?",
        a: "We are committed to offering genuine products and sourcing inventory through trusted suppliers and authorized distribution channels. Product information and availability may vary by brand.",
      },
      {
        q: "Do you offer gift wrapping?",
        a: "Gift wrapping may be available for selected products during checkout. Where available, you can also add a personalized message to your order.",
      },
    ],
  },
  {
    category: "Account & Payment",
    icon: CreditCard,
    description: "Payments, accounts, security, and login help.",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "Available payment methods may include credit and debit cards, bank transfers, and Cash on Delivery for eligible locations. The payment options available to you will be shown during checkout.",
      },
      {
        q: "Is it safe to use my credit card?",
        a: "We take reasonable security measures to protect customer information and payment data. Payment processing is handled through secure payment infrastructure, and sensitive payment details are not stored directly by our application unless required by the payment provider.",
      },
      {
        q: "How can I reset my password?",
        a: "Select 'Forgot Password' on the login page and enter the email address associated with your account. You will receive instructions to create a new password.",
      },
    ],
  },
];

const popularTopics = [
  {
    title: "Track your order",
    description: "Check your latest order status.",
    href: "/track-order",
    icon: Package,
  },
  {
    title: "Shipping & Returns",
    description: "Delivery and return information.",
    href: "/shipping",
    icon: Truck,
  },
  {
    title: "Size Guide",
    description: "Find the right fit before ordering.",
    href: "/size-guide",
    icon: Ruler,
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    {
      name: "All",
      icon: HelpCircle,
    },
    ...faqs.map((category) => ({
      name: category.category,
      icon: category.icon,
    })),
  ];

  const filteredFAQs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return faqs
      .filter((category) => {
        if (activeCategory === "All") return true;
        return category.category === activeCategory;
      })
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (!query) return true;

          return (
            item.q.toLowerCase().includes(query) ||
            item.a.toLowerCase().includes(query) ||
            category.category.toLowerCase().includes(query)
          );
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [searchQuery, activeCategory]);

  const totalResults = filteredFAQs.reduce(
    (total, category) => total + category.items.length,
    0
  );

  const toggleFAQ = (categoryIndex, itemIndex) => {
    const key = `${categoryIndex}-${itemIndex}`;

    setOpenIndex((current) => (current === key ? null : key));
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveCategory("All");
    setOpenIndex(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* =====================================================
          HERO / SEARCH SECTION
      ====================================================== */}
      <section className="relative overflow-hidden bg-white border-b border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F766E]/5 via-white to-gray-100 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-2 pt-6 text-xs sm:text-sm text-gray-500"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="hover:text-[#0F766E] transition-colors"
            >
              Home
            </Link>

            <span>/</span>

            <span className="font-medium text-gray-700">FAQ</span>
          </nav>

          <div className="max-w-3xl mx-auto text-center py-12 sm:py-16">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F766E]/10 text-[#0F766E]">
              <HelpCircle className="w-7 h-7" />
            </div>

            <p className="mt-5 text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#0F766E]">
              Help Center
            </p>

            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-700">
              How can we help?
            </h1>

            <p className="mt-4 text-sm sm:text-base text-gray-600 leading-7">
              Find answers to common questions about orders, shipping,
              returns, payments, products, and your account.
            </p>

            {/* Search */}
            <div className="relative mt-8 max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpenIndex(null);
                }}
                placeholder="Search for answers..."
                aria-label="Search frequently asked questions"
                className="w-full h-14 pl-12 pr-12 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 outline-none transition-all focus:border-[#0F766E] focus:ring-4 focus:ring-[#0F766E]/10 "
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
              <span>Popular:</span>

              <button
                onClick={() => setSearchQuery("track")}
                className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-[#0F766E]/10 hover:text-[#0F766E] transition-colors"
              >
                Track order
              </button>

              <button
                onClick={() => setSearchQuery("return")}
                className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-[#0F766E]/10 hover:text-[#0F766E] transition-colors"
              >
                Returns
              </button>

              <button
                onClick={() => setSearchQuery("payment")}
                className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-[#0F766E]/10 hover:text-[#0F766E] transition-colors"
              >
                Payments
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CATEGORY NAVIGATION
      ====================================================== */}
      <section className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.name;

              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.name);
                    setOpenIndex(null);
                  }}
                  className={`
                    flex items-center gap-2 whitespace-nowrap
                    px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium
                    border transition-all
                    ${
                      isActive
                        ? "bg-[#0F766E] text-white border-[#0F766E] "
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#0F766E]/40 hover:text-[#0F766E] hover:bg-[#0F766E]/5"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* =================================================
                FAQ LIST
            ================================================== */}
            <div className="lg:col-span-2">
              {/* Results Header */}
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {searchQuery
                      ? `${totalResults} ${
                          totalResults === 1 ? "result" : "results"
                        } found`
                      : activeCategory === "All"
                      ? "Frequently asked questions"
                      : activeCategory}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Find quick answers to common questions.
                  </p>
                </div>

                {(searchQuery || activeCategory !== "All") && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-xs font-medium text-[#0F766E] hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* No Results */}
              {filteredFAQs.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 sm:p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <Search className="w-6 h-6" />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold text-gray-700">
                    No answers found
                  </h2>

                  <p className="mt-2 max-w-md mx-auto text-sm text-gray-500 leading-6">
                    We could not find any questions matching your search.
                    Try a different keyword or contact our support team.
                  </p>

                  <button
                    type="button"
                    onClick={clearSearch}
                    className="mt-6 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#0F766E] text-white text-sm font-medium hover:bg-[#0F766E]/90 transition-colors"
                  >
                    View all questions
                  </button>
                </div>
              )}

              {/* FAQ Categories */}
              <div className="space-y-6">
                {filteredFAQs.map((category, catIndex) => {
                  const CategoryIcon = category.icon;

                  return (
                    <div
                      key={category.category}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white "
                    >
                      {/* Category Header */}
                      <div className="flex items-center gap-4 px-5 sm:px-6 py-5 bg-gray-50/80 border-b border-gray-200">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0F766E]/10 text-[#0F766E]">
                          <CategoryIcon className="w-5 h-5" />
                        </div>

                        <div>
                          <h2 className="text-sm sm:text-base font-semibold text-gray-700">
                            {category.category}
                          </h2>

                          <p className="mt-0.5 text-xs text-gray-500">
                            {category.description}
                          </p>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="divide-y divide-gray-100">
                        {category.items.map((item, itemIndex) => {
                          const key = `${catIndex}-${itemIndex}`;
                          const isOpen = openIndex === key;

                          return (
                            <div key={item.q}>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleFAQ(catIndex, itemIndex)
                                }
                                aria-expanded={isOpen}
                                className="w-full flex items-center justify-between gap-5 px-5 sm:px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                              >
                                <span
                                  className={`text-sm sm:text-[15px] font-medium leading-6 ${
                                    isOpen
                                      ? "text-[#0F766E]"
                                      : "text-gray-800"
                                  }`}
                                >
                                  {item.q}
                                </span>

                                <span
                                  className={`
                                    flex h-8 w-8 shrink-0 items-center justify-center
                                    rounded-full border transition-all
                                    ${
                                      isOpen
                                        ? "bg-[#0F766E] border-[#0F766E] text-white"
                                        : "bg-white border-gray-200 text-gray-400"
                                    }
                                  `}
                                >
                                  <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 ${
                                      isOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                </span>
                              </button>

                              <div
                                className={`
                                  grid transition-[grid-template-rows] duration-200 ease-out
                                  ${
                                    isOpen
                                      ? "grid-rows-[1fr]"
                                      : "grid-rows-[0fr]"
                                  }
                                `}
                              >
                                <div className="overflow-hidden">
                                  <div className="px-5 sm:px-6 pb-5 pr-14">
                                    <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                                      <p className="text-sm text-gray-600 leading-6">
                                        {item.a}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* =================================================
                SIDEBAR
            ================================================== */}
            <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">   {/* Popular Topics */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 ">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">
                    Popular topics
                  </h2>

                  <span className="text-xs text-gray-400">
                    Quick links
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {popularTopics.map((topic) => {
                    const Icon = topic.icon;

                    return (
                      <Link
                        key={topic.title}
                        href={topic.href}
                        className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-[#0F766E]/20 hover:bg-[#0F766E]/5 transition-all"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-[#0F766E]/10 group-hover:text-[#0F766E] transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-[#0F766E] transition-colors">
                            {topic.title}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            {topic.description}
                          </p>
                        </div>

                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0F766E] transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </div>
              {/* Contact Support */}
              <div className="overflow-hidden rounded-2xl bg-[#0F766E] text-white ">
                <div className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                    <MessageCircle className="w-5 h-5" />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold">
                    Still need help?
                  </h2>

                  <p className="mt-2 text-sm text-white/75 leading-6">
                    Our support team is here to help with orders, products,
                    payments, returns, and other questions.
                  </p>

                  <Link
                    href="/contact"
                    className="mt-6 flex items-center justify-center gap-2 w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#0F766E] hover:bg-gray-100 transition-colors"
                  >
                    Contact Support
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="border-t border-white/10 px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <Clock3 className="w-4 h-4" />
                    Support available during business hours
                  </div>
                </div>
              </div>

           

           
            </aside>
          </div>
        </div>
      </section>

   
    </main>
  );
}

/* =========================================================
   TRUST ITEM
========================================================= */

function TrustItem({ text }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-green-500" />

      <span className="text-xs text-gray-600">{text}</span>
    </div>
  );
}