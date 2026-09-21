"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiChevronRight as ChevronRight,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiSend,
  FiShield,
} from "react-icons/fi";

const initialFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const MAX_MESSAGE_LENGTH = 1000;

export default function ContactPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "message" && value.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    // Replace this simulated request with your real API request.
    await new Promise((resolve) => setTimeout(resolve, 900));

    setSubmitted(true);
    setFormData(initialFormData);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!submitted) return;

    const timer = setTimeout(() => {
      setSubmitted(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [submitted]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#0F766E]/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-teal-100/40 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
             className="mb-4 flex items-center gap-1.5 text-sm"
    >
            <Link
              href="/"
              className="font-medium text-gray-500 transition-colors hover:text-[#0F766E]"
            >
              Home
            </Link>

            <ChevronRight className="h-4 w-4 text-gray-400" />

            <span className="font-medium text-gray-700">Contact</span>
          </nav>

          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#0F766E]/15 bg-[#0F766E]/5 px-3 py-1 text-[12px] font-medium text-[#0F766E]">
              <FiMessageCircle className="h-4 w-4"  />
              We&apos;re here to help
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-gray-800 sm:text-3xl lg:text-4xl">
              How can we help you?
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              Have a question about your order, products, shipping, returns,
              payments, or something else? Send us a message and our support
              team will get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}
      <section className="mx-auto max-w-7xl px-4  sm:px-6  lg:px-8 py-5 sm:py-6 lg:py-8Have a question about your order, products, shipping, returns, payments, or something else? Send us a message and our support team will get back to you as soon as possible.

">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* =====================================================
              CONTACT FORM
          ====================================================== */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white ">
              {/* Form Header */}
              <div className="border-b border-gray-100 px-5 py-5 sm:px-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                    <FiSend size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Send us a message
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      Fill out the form below and our support team will get
                      back to you within 24 hours.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-5 sm:p-8">
                {submitted ? (
                  /* =================================================
                     SUCCESS STATE
                  ================================================== */
                  <div className="flex min-h-[500px] flex-col items-center justify-center px-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                      <FiCheckCircle
                        className="text-green-600"
                        size={32}
                      />
                    </div>

                    <h2 className="mt-6 text-2xl font-semibold text-gray-800">
                      Message sent successfully
                    </h2>

                    <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
                      Thank you for reaching out. Our support team has received
                      your message and will contact you within 24 hours.
                    </p>

                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0F766E]/90 focus:outline-none focus:ring-4 focus:ring-[#0F766E]/10"
                    >
                      Send another message
                      <FiArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      {/* Name + Email */}
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Name */}
                        <div>
                          <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-semibold text-gray-800"
                          >
                            Full name
                            <span className="ml-1 text-red-500">*</span>
                          </label>

                          <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            autoComplete="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-[#0F766E] focus:ring-4 focus:ring-[#0F766E]/10"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-semibold text-gray-800"
                          >
                            Email address
                            <span className="ml-1 text-red-500">*</span>
                          </label>

                          <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-[#0F766E] focus:ring-4 focus:ring-[#0F766E]/10"
                          />
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label
                          htmlFor="subject"
                          className="mb-2 block text-sm font-semibold text-gray-800"
                        >
                          Subject
                          <span className="ml-1 text-red-500">*</span>
                        </label>

                        <input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="How can we help you?"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-[#0F766E] focus:ring-4 focus:ring-[#0F766E]/10"
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label
                            htmlFor="message"
                            className="block text-sm font-semibold text-gray-800"
                          >
                            Message
                            <span className="ml-1 text-red-500">*</span>
                          </label>

                          <span
                            className={`text-xs ${
                              formData.message.length >=
                              MAX_MESSAGE_LENGTH * 0.9
                                ? "text-orange-500"
                                : "text-gray-400"
                            }`}
                          >
                            {formData.message.length}/{MAX_MESSAGE_LENGTH}
                          </span>
                        </div>

                        <textarea
                          id="message"
                          name="message"
                          required
                          rows={7}
                          maxLength={MAX_MESSAGE_LENGTH}
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Tell us how we can help..."
                          className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-700 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-[#0F766E] focus:ring-4 focus:ring-[#0F766E]/10"
                        />
                      </div>

                   

                      {/* Submit */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                     

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3.5 text-sm font-semibold text-white  transition hover:bg-[#0F766E]/90 focus:outline-none focus:ring-4 focus:ring-[#0F766E]/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Message
                              <FiArrowRight size={16} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* =====================================================
              SIDEBAR
          ====================================================== */}
          <aside className="space-y-6">
            {/* =================================================
                CONTACT INFORMATION
            ================================================== */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white   duration-300 ">
              {/* Header */}
              <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">

                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0F766E]">
                        Get in touch
                      </p>
                    </div>

                    <h2 className="text-lg font-semibold tracking-tight text-gray-800">
                      Contact information
                    </h2>

                    <p className="mt-1.5 max-w-sm text-sm leading-5 text-gray-500">
                      Have a question? Our support team is ready to help.
                    </p>
                  </div>

                 
                </div>
              </div>

              {/* Contact Details */}
              <div className="p-5 sm:p-6">
                <div className="space-y-3">
                  {/* Address */}
                  <div className="group -mx-3 flex items-start gap-4 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E] transition-colors duration-200 group-hover:bg-[#0F766E] group-hover:text-white">
                      <FiMapPin size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        Visit us
                      </p>

                      <p className="mt-1 text-sm leading-5 text-gray-500">
                        123 Fashion Street
                        <br />
                        Karachi, Pakistan
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100" />

                  {/* Phone */}
                  <a
                    href="tel:+923001234567"
                    className="group -mx-3 flex items-center gap-4 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E] transition-colors duration-200 group-hover:bg-[#0F766E] group-hover:text-white">
                      <FiPhone size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        Call us
                      </p>

                      <p className="mt-1 text-sm text-gray-500 transition-colors group-hover:text-[#0F766E]">
                        +92 300 1234567
                      </p>
                    </div>

                  
                  </a>

                  {/* Divider */}
                  <div className="h-px bg-gray-100" />

                  {/* Email */}
                  <a
                    href="mailto:support@store.com"
                    className="group -mx-3 flex items-center gap-4 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E] transition-colors duration-200 group-hover:bg-[#0F766E] group-hover:text-white">
                      <FiMail size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        Email us
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-500 transition-colors group-hover:text-[#0F766E]">
                        support@store.com
                      </p>
                    </div>

                  
                  </a>
                </div>

              
              </div>
            </div>

            {/* =================================================
                BUSINESS HOURS
            ================================================== */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5   duration-300  sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                  <FiClock size={18} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-800">
                    Business hours
                  </h2>

                  <p className="text-xs text-gray-500">
                    Pakistan Standard Time
                  </p>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="text-gray-500">
                    Monday - Friday
                  </span>

                  <span className="whitespace-nowrap font-medium text-gray-700">
                    9:00 AM - 6:00 PM
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="text-gray-500">Saturday</span>

                  <span className="whitespace-nowrap font-medium text-gray-700">
                    10:00 AM - 4:00 PM
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="text-gray-500">Sunday</span>

                  <span className="font-medium text-gray-400">
                    Closed
                  </span>
                </div>
              </div>
            </div>

        
          </aside>
        </div>
      </section>

 
    </main>
  );
}