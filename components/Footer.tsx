"use client"

import Crosshairs from "@/components/Crosshairs"

/** Lucide v1+ removed brand icons; keep minimal inline SVGs for social links */
function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}
function IconYoutube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const columns = {
  product: {
    title: "Product",
    links: [
      { label: "Suraksha Band", href: "#craft" },
      { label: "Suraksha App", href: "#product" },
      { label: "Safe Walk", href: "#product" },
      { label: "Live Tracking", href: "#product" },
    ],
  },
  technology: {
    title: "Technology",
    links: [
      { label: "IoT Hardware", href: "#craft" },
    ],
  },
  about: {
    title: "About Us",
    links: [
      { label: "About Us", href: "#philosophy" },
      { label: "Our Mission", href: "#brand" },
      { label: "Partners", href: "#" },
    ],
  },
  additional: {
    title: "Additional",
    links: [
      { label: "Dealers", href: "#" },
      { label: "Service", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  documents: {
    title: "Documents",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms & Conditions", href: "#" },
      { label: "Cookie Settings", href: "#" },
      { label: "Imprint", href: "#" },
    ],
  },
  contact: {
    title: "Contact",
    links: [] as { label: string; href: string }[],
  },
}

export default function Footer() {
  return (
    <footer>
      {/* Large brand name section - dark background like lightweight.info */}
      <div className="relative border-t border-[#222222] py-20 lg:py-28 overflow-hidden">
        <Crosshairs />
        <div className="mx-auto max-w-7xl px-6 lg:px-10 flex items-center justify-center">
          <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] italic font-light text-[#FAFAFA]/10 select-none tracking-tight">
            Suraksha
          </span>
        </div>
      </div>

      {/* Multi-column footer links grid */}
      <div className="border-t border-[#222222] py-16 lg:py-20 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-10 lg:gap-8">
            {/* Product */}
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#FAFAFA] mb-5">
                {columns.product.title}
              </p>
              <ul className="flex flex-col gap-3">
                {columns.product.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technology */}
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#FAFAFA] mb-5">
                {columns.technology.title}
              </p>
              <ul className="flex flex-col gap-3">
                {columns.technology.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* About Us */}
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#FAFAFA] mb-5">
                {columns.about.title}
              </p>
              <ul className="flex flex-col gap-3">
                {columns.about.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Additional */}
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#FAFAFA] mb-5">
                {columns.additional.title}
              </p>
              <ul className="flex flex-col gap-3">
                {columns.additional.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Documents */}
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#FAFAFA] mb-5">
                {columns.documents.title}
              </p>
              <ul className="flex flex-col gap-3">
                {columns.documents.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#FAFAFA] mb-5">
                {columns.contact.title}
              </p>
              <div className="flex flex-col gap-3">
                <a href="tel:+911234567890" className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors">
                  +91 123 456 7890
                </a>
                <a href="mailto:hello@suraksha.com" className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors">
                  hello@suraksha.com
                </a>
                <a
                  href="#newsletter"
                  className="inline-flex items-center justify-center mt-3 px-6 py-3 border border-[#FAFAFA]/20 text-[#FAFAFA] text-xs font-medium tracking-[0.12em] uppercase rounded-full transition-all duration-300 hover:bg-[#FAFAFA] hover:text-[#0A0A0A]"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>

          {/* Social icons centered at bottom */}
          <div className="mt-14 pt-8 border-t border-[#222222] flex flex-col items-center gap-6">
            <div className="flex items-center gap-6">
              <a href="#" aria-label="Facebook" className="text-[#888888] hover:text-[#FAFAFA] transition-colors">
                <IconFacebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram" className="text-[#888888] hover:text-[#FAFAFA] transition-colors">
                <IconInstagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="YouTube" className="text-[#888888] hover:text-[#FAFAFA] transition-colors">
                <IconYoutube className="w-5 h-5" />
              </a>
            </div>
            <p className="text-xs text-[#888888]/60">
              {`\u00A9 ${new Date().getFullYear()} Suraksha. All rights reserved.`}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
