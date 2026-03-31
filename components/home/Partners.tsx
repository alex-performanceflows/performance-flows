"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

const partners = [
  {
    name: "Google Partner",
    logo: (
      <div className="flex items-center gap-3">
        {/* Google G icon — official color segments */}
        <svg viewBox="0 0 46 46" className="h-9 w-9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.5 19.5H44.5C44.8 20.9 45 22.2 45 23.5C45 35.4 36.9 44 23.5 44C10.6 44 0 33.4 0 20.5C0 7.6 10.6 -3 23.5 -3C29.8 -3 35.2 -0.7 39.3 3.1L33.6 8.8C31.2 6.6 27.6 5.1 23.5 5.1C14.5 5.1 7.2 12.4 7.2 21.4C7.2 30.4 14.5 37.7 23.5 37.7C31.4 37.7 35.6 33.1 36.8 29.3H23.5V19.5Z" fill="#4285F4"/>
          <path d="M23.5 19.5H44.5C44.8 20.9 45 22.2 45 23.5C45 35.4 36.9 44 23.5 44C10.6 44 0 33.4 0 20.5C0 14.6 2.2 9.2 5.8 5.1L12.4 10.7C10.1 13.3 8.7 16.7 8.7 20.5C8.7 29 15.4 35.7 23.9 35.7C30.2 35.7 35.3 32.1 37.3 26.9H23.5V19.5Z" fill="#34A853"/>
          <path d="M5.8 5.1C9.4 1 14.7 -3 23.5 -3C29.8 -3 35.2 -0.7 39.3 3.1L33.6 8.8C31.2 6.6 27.6 5.1 23.5 5.1C18.3 5.1 13.8 7.6 10.9 11.4L5.8 5.1Z" fill="#EA4335"/>
          <path d="M0 20.5C0 14.6 2.2 9.2 5.8 5.1L11.5 11.4C9.2 14 8.7 17.1 8.7 20.5H0Z" fill="#FBBC05"/>
        </svg>
        <div className="leading-tight">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Google</p>
          <p className="text-sm font-bold text-gray-700">Partner</p>
        </div>
      </div>
    ),
  },
  {
    name: "Shopify Partners",
    logo: (
      <div className="flex items-center gap-3">
        {/* Shopify bag icon */}
        <svg viewBox="0 0 109 124" className="h-9 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M95.3 23.8c-.1-.6-.6-1-1.1-1h-.4c-.5 0-9-.7-9-.7s-6-6-6.7-6.7c-.7-.7-2-.5-2.5.1l-3.6 1.1c-1.6-4.6-4.5-8.8-9.5-8.8h-.4C60.5 5.3 58.5 4 56.2 4c-12.4 0-18.4 15.5-20.3 23.4l-9.2 2.8c-2.9.9-3 1-3.4 3.7C23 35.8 14 101.7 14 101.7L73.1 113l32.2-7S95.4 24.4 95.3 23.8zM69.9 16.5l-5.7 1.7c0-.4.1-.8.1-1.3 0-3.9-1.3-7.1-3.4-9.5C64.3 8 68.2 11.4 69.9 16.5zm-14 4.2l-12 3.7c1.7-6.5 4.9-9.6 7.8-10.8.7 1.8 4.2 4.8 4.2 7.1zM56 8c.7 0 1.3.2 1.8.6-4.5 2.1-9.3 7.5-11.3 18.2l-8.5 2.6C40.4 22 46.2 8 56 8z" fill="#95BF47"/>
          <path d="M94.2 22.8h-.4c-.5 0-9-.7-9-.7s-6-6-6.7-6.7c-.3-.3-.6-.4-.9-.4l-4.1 84.9 32.2-7S95.4 24.4 95.3 23.8c-.1-.6-.6-1-1.1-1z" fill="#5E8E3E"/>
          <path d="M62.2 43.8l-3.9 11.6s-3.4-1.8-7.5-1.8c-6 0-6.3 3.8-6.3 4.8.3 5 13.5 6 14.2 17.7.5 9.2-4.9 15.5-12.7 16-9.5.6-14.3-5-14.3-5l1.9-8.2s5 3.8 9 3.5c2.5-.2 3.5-2.2 3.4-3.7-.4-6.5-11.1-6.1-11.7-16.8-.5-9 5.3-18 18.3-18.8 5-.3 7.6 1.7 7.6 1.7z" fill="white"/>
        </svg>
        <div className="leading-tight">
          <p className="text-xs font-bold text-[#5E8E3E] uppercase tracking-wider">Shopify</p>
          <p className="text-sm font-bold text-gray-700">Partners</p>
        </div>
      </div>
    ),
  },
  {
    name: "Klaviyo Partner",
    logo: (
      <div className="flex items-center gap-3">
        {/* Klaviyo "K" icon */}
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="6" fill="#1A1A1A"/>
          <path d="M10 8h5.5v10.5L25.5 8H32L21.5 19.5 32.5 32H26L15.5 21V32H10V8z" fill="white"/>
        </svg>
        <div className="leading-tight">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Klaviyo</p>
          <p className="text-sm font-bold text-gray-700">Partner</p>
        </div>
      </div>
    ),
  },
  {
    name: "Channable Partner",
    logo: (
      <div className="flex items-center gap-3">
        {/* Channable icon — their connected arrows/flow logo */}
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="6" fill="#E8F4FD"/>
          <circle cx="8" cy="20" r="4" fill="#0066CC"/>
          <circle cx="32" cy="12" r="4" fill="#0066CC"/>
          <circle cx="32" cy="28" r="4" fill="#0066CC"/>
          <line x1="12" y1="18" x2="28" y2="13.5" stroke="#0066CC" strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="22" x2="28" y2="26.5" stroke="#0066CC" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div className="leading-tight">
          <p className="text-xs font-bold text-[#0066CC] uppercase tracking-wider">Channable</p>
          <p className="text-sm font-bold text-gray-700">Partner</p>
        </div>
      </div>
    ),
  },
];

export default function Partners() {
  return (
    <section className="bg-white border-b border-gray-100 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
              Partner ufficiali
            </p>
            <div className="w-px h-8 bg-gray-200 hidden md:block" />
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {partners.map((partner) => (
                <div key={partner.name} className="opacity-75 hover:opacity-100 transition-opacity">
                  {partner.logo}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
