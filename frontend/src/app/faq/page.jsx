"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  { category: "Orders & Shipping", items: [
    { q: "How do I track my order?", a: "Once your order ships, you will receive a tracking number via email. You can also track your order on our Track Order page using your order ID and email." },
    { q: "What shipping methods do you offer?", a: "We offer Standard (5-7 days), Express (2-3 days), and Overnight (1 day) shipping. Free shipping is available on orders over $50." },
    { q: "Do you ship internationally?", a: "Currently, we ship within Pakistan only. We are working on expanding our shipping options to more regions." },
  ]},
  { category: "Returns & Exchanges", items: [
    { q: "What is your return policy?", a: "We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in original packaging with tags attached." },
    { q: "How do I initiate a return?", a: "Contact our support team with your order number and reason for return. We will provide a prepaid return label and instructions." },
    { q: "Are exchanges free?", a: "Yes, size and color exchanges are free within 30 days of purchase, subject to availability." },
  ]},
  { category: "Products & Sizing", items: [
    { q: "How do I find my size?", a: "Check our Size Guide for detailed measurements. If you are between sizes, we recommend sizing up for a comfortable fit." },
    { q: "Are your products authentic?", a: "Yes, all products sold on our store are 100% authentic and sourced directly from authorized distributors." },
    { q: "Do you offer gift wrapping?", a: "Yes, gift wrapping is available at checkout for a small additional fee. You can also include a personalized message." },
  ]},
  { category: "Account & Payment", items: [
    { q: "What payment methods do you accept?", a: "We accept credit/debit cards (Visa, MasterCard), bank transfers, and cash on delivery (COD) for select locations." },
    { q: "Is it safe to use my credit card?", a: "Yes, we use industry-standard SSL encryption to protect your personal and payment information." },
    { q: "How can I reset my password?", a: "Click on 'Forgot Password' on the login page and enter your email. We will send you a link to reset your password." },
  ]},
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (catIndex, itemIndex) => {
    const key = `${catIndex}-${itemIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#0F766E]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">FAQ</span>
        </nav>
        <h1 className="text-3xl font-medium text-gray-800 tracking-wide uppercase mb-8">Frequently Asked Questions</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {faqs.map((category, catIndex) => (
              <div key={category.category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider px-6 py-4 bg-gray-50 border-b border-gray-200">{category.category}</h2>
                <div className="divide-y divide-gray-100">
                  {category.items.map((item, itemIndex) => {
                    const key = `${catIndex}-${itemIndex}`;
                    const isOpen = openIndex === key;
                    return (
                      <div key={item.q}>
                        <button onClick={() => toggle(catIndex, itemIndex)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition">
                          <span className="text-sm font-medium text-gray-800">{item.q}</span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Still Need Help?</h3>
              <p className="text-sm text-gray-500 mb-4">Can&apos;t find the answer you are looking for? Our support team is happy to assist you.</p>
              <Link href="/contact" className="block w-full text-center py-2.5 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E]/90 transition">Contact Us</Link>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Popular Topics</h3>
              <div className="space-y-2">
                <Link href="/shipping" className="block text-sm text-[#0F766E] hover:underline">Shipping &amp; Returns</Link>
                <Link href="/size-guide" className="block text-sm text-[#0F766E] hover:underline">Size Guide</Link>
                <Link href="/track-order" className="block text-sm text-[#0F766E] hover:underline">Track Order</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
