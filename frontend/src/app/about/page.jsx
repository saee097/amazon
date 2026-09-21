"use client";

import Link from "next/link";
import { IoStarOutline } from "react-icons/io5";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Headphones,
  Heart,
  Package,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-700">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
        {/* Background decoration */}
       

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-1.5 text-sm"
          >
            <Link
              href="/"
                   className="font-medium text-gray-700">

          
              Home
            </Link>

            <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-700">
         About
        </span>
 </nav>
          <div className="grid items-start gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            {/* Hero content */}
            <div className="flex h-[540px] max-w-2xl flex-col">
             <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-[#0F766E]/15 bg-[#0F766E]/5 px-3 py-1 text-[12px] font-medium text-[#0F766E]">
  <Sparkles className="h-4 w-4" />
  Built for better shopping
</div>

              <h1 className="text-2xl font-semibold leading-[1.08] tracking-[-0.03em] text-gray-700 sm:text-3xl lg:text-[40px]">
                Shopping made
                <span className="mt-1 block text-[#0F766E]">
                  simple and enjoyable.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
                At STORE, we make it easier to discover quality products, shop
                with confidence, and enjoy a seamless experience from browsing
                to delivery.
              </p>

             

              {/* Actions */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0F766E]/90  focus:outline-none focus:ring-4 focus:ring-[#0F766E]/15"
                >
                  Explore Products
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200"
                >
                  Contact Us
                </Link>
              </div>

             
            </div>

            {/* Hero image */}
            <div className="relative lg:pl-4">
              <div className="relative overflow-hidden rounded-[28px] border border-gray-200 bg-gray-100 ">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=85"
                  alt="Customer shopping online"
                  className="h-[360px] w-full object-cover sm:h-[450px] lg:h-[540px]"
                />

            

                {/* Image bottom card */}
                <div className="absolute bottom-2 left-5 right-5">
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white/95 p-4  backdrop-blur-md sm:p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F766E] text-white">
                      <ShoppingBag className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-700">
                        A better way to shop
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Discover. Choose. Checkout. Delivered.
                      </p>
                    </div>

                    <div className="ml-auto hidden shrink-0 sm:block">
                      <BadgeCheck className="h-6 w-6 text-[#0F766E]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating card */}
              <div className="absolute bottom-20 -left-9 hidden rounded-lg border border-gray-200 bg-white p-4 sm:block lg:-left-20">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-amber-50">
                    <IoStarOutline className="h-5 w-5 fill-amber-400 text-amber-400" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      4.8 / 5
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Customer rating
                    </p>
                  </div>
                </div>
              </div>

           
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          TRUST STATS
      ========================================================== */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            <Stat
              icon={<Users className="h-5 w-5" />}
              value="50K+"
              label="Happy Customers"
            />

            <Stat
              icon={<Package className="h-5 w-5" />}
              value="120K+"
              label="Orders Delivered"
            />

            <Stat
              icon={<ShoppingBag className="h-5 w-5" />}
              value="5K+"
              label="Products"
            />

            <Stat
              icon={<IoStarOutline className="h-5 w-5" />}
              value="4.8/5"
              label="Customer Rating"
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          OUR STORY
      ========================================================== */}
      <section className="bg-gray-50 py-8 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Story content */}
            <div className="flex h-[440px] flex-col">
              <SectionEyebrow>Our Story</SectionEyebrow>

              <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-gray-700 sm:text-3xl">
                We started with a simple idea.
              </h2>

              <div className="mt-6 max-w-xl space-y-4 text-sm leading-7 text-gray-600 sm:text-base">
                <p>
                  STORE was created with one simple goal: to make online
                  shopping more convenient, transparent, and enjoyable.
                </p>

                <p>
                  What started as a small online store has grown into a
                  customer-focused shopping platform offering a carefully
                  selected range of products for everyday needs and modern
                  lifestyles.
                </p>

                
              </div>

          
            </div>

            {/* Story image */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-[28px] border border-gray-200 bg-white">
                <img
                  src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=85"
                  alt="Customer enjoying an online shopping experience"
                  className="h-[360px] w-full object-cover sm:h-[440px]"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                {/* Story overlay */}
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="rounded-lg border border-white/30 bg-white/95 p-5  backdrop-blur-md">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0F766E] text-white">
                        <Heart className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-gray-700">
                          Built around our customers
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                       Making shopping better, every day.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Founded card */}
              <div className="absolute -bottom-6 -right-3 hidden rounded-lg border border-gray-200 bg-white px-3.5 py-2.5  sm:block lg:-right-7">
                <p className="text-xl font-semibold text-[#0F766E]">2020</p>
                <p className="mt-0.5 text-xs font-medium text-gray-500">
                  Founded
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          VALUES
      ========================================================== */}
      <section className="border-y border-gray-200 bg-white py-12 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className=" mb-6 max-w-2xl ">
            <SectionEyebrow>What We Stand For</SectionEyebrow>

            <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-gray-700 sm:text-3xl">
              Our values guide every decision.
            </h2>
<div className="mt-6 max-w-xl space-y-4 text-sm leading-7 text-gray-600 sm:text-base">  <p className="mt-4 text-sm leading-6 text-gray-600 sm:text-base">
              From product selection to customer support, we focus on building
              a shopping experience people can trust.
            </p></div>
          
          </div>

          <div className="grid grid-cols-1  gap-5 md:grid-cols-2 lg:grid-cols-3">
            <ValueCard
              icon={<ShieldCheck />}
              title="Quality You Can Trust"
              description="We focus on offering products that meet our standards for quality, reliability, and value."
            />

            <ValueCard
              icon={<Heart />}
              title="Customer First"
              description="Our customers are at the center of what we do. We continuously work to make their experience better."
            />

            <ValueCard
              icon={<Sparkles />}
              title="Simple Experience"
              description="We keep the shopping journey straightforward, from discovering products to completing your order."
            />

            <ValueCard
              icon={<Truck />}
              title="Reliable Delivery"
              description="We work to make order fulfillment and delivery predictable, convenient, and transparent."
            />

            <ValueCard
              icon={<CheckCircle2 />}
              title="Fair Value"
              description="We aim to provide competitive pricing while maintaining the quality and service our customers expect."
            />

            <ValueCard
              icon={<Users />}
              title="Long-Term Relationships"
              description="We want every order to be the beginning of a lasting relationship with our customers."
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          WHY STORE
      ========================================================== */}
      <section className="bg-gray-50 py-8 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            {/* Intro */}
            <div>
              <SectionEyebrow>Why STORE</SectionEyebrow>

              <h2 className="mt-3 max-w-md text-2xl font-semibold tracking-tight text-gray-700 sm:text-3xl">
                More than just an online store.
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-gray-600 sm:text-base">
                We combine a carefully managed product catalog with a
                customer-focused shopping experience designed for modern
                online shoppers.
              </p>

              <Link
                href="/products"
                className="mt-7 inline-flex hover:underline items-center gap-2 text-sm font-semibold text-[#0F766E] transition-all hover:gap-3"
              >
                Explore our products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Benefits */}
            <div className="grid gap-4 sm:grid-cols-2">
              <BenefitCard
                
                icon={<Sparkles />}
                title="Easy Discovery"
                description="Browse categories, search products, and find what you need without unnecessary complexity."
              />

              <BenefitCard
             
                icon={<ShieldCheck />}
                title="Secure Checkout"
                description="A streamlined checkout experience designed to keep your order information organized and secure."
              />

              <BenefitCard
             
                icon={<Package />}
                title="Order Tracking"
                description="Stay informed about your order from confirmation through delivery."
              />

              <BenefitCard
              
                icon={<Headphones />}
                title="Customer Support"
                description="Need help? Our support experience is designed to make resolving questions easier."
              />
            </div>
          </div>
        </div>
      </section>

     

 
    </main>
  );
}

/* =========================================================
   SECTION EYEBROW
========================================================= */
function SectionEyebrow({ children, light = false }) {
  return (
    <span
      className={`text-xs font-bold uppercase tracking-[0.18em] ${
        light ? "text-teal-300" : "text-[#0F766E]"
      }`}
    >
      {children}
    </span>
  );
}

/* =========================================================
   HERO TRUST POINT
========================================================= */
function HeroTrustPoint({ text }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0F766E]/10">
        <CheckCircle2 className="h-3.5 w-3.5 text-[#0F766E]" />
      </div>

      <span className="text-sm font-medium text-gray-700">{text}</span>
    </div>
  );
}

/* =========================================================
   STAT
========================================================= */
function Stat({ icon, value, label }) {
  return (
    <div className="relative flex flex-col items-center justify-center px-3 py-7 text-center sm:py-8 lg:border-l lg:border-gray-100">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-[#0F766E]/10 text-[#0F766E]">
        {icon}
      </div>

      <p className="text-xl font-bold tracking-tight text-gray-700 sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500 sm:text-sm">{label}</p>
    </div>
  );
}

/* =========================================================
   FEATURE
========================================================= */
function Feature({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0F766E]/10">
        <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
      </div>

      <span className="text-sm font-medium text-gray-700">{text}</span>
    </div>
  );
}

/* =========================================================
   VALUE CARD
========================================================= */
function ValueCard({ icon, title, description }) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#0F766E]/25 ">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E] transition-all duration-300 group-hover:bg-[#0F766E] group-hover:text-white">
          <div className="h-5 w-5">{icon}</div>
        </div>

       
      </div>

      <h3 className="mt-6 text-base font-bold text-gray-700">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   BENEFIT CARD
========================================================= */
function BenefitCard({ number, icon, title, description }) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 ">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E] transition-colors duration-300 group-hover:bg-[#0F766E] group-hover:text-white">
          <div className="h-5 w-5">{icon}</div>
        </div>

        <span className="text-xs font-bold tracking-[0.2em] text-gray-300">
          {number}
        </span>
      </div>

      <h3 className="mt-5 text-base font-bold text-gray-700">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>
    </div>
  );
}

