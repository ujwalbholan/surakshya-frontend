"use client";

import Crosshairs from "@/components/Crosshairs";
import { IconFacebook, IconInstagram, IconYoutube } from "./iconsComp/icons";

const columns = {
  product: {
    title: "Product",
    links: [
      { label: "Surakshya Band", href: "#craft" },
      { label: "Surakshya App", href: "#product" },
      { label: "Safe Walk", href: "#product" },
      { label: "Live Tracking", href: "#product" },
    ],
  },
  technology: {
    title: "Technology",
    links: [{ label: "IoT Hardware", href: "#craft" }],
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
};

export default function Footer() {
  return (
    <footer>
      {/* Large brand name section - dark background like lightweight.info */}
      <div className="relative border-t border-[#222222] py-20 lg:py-28 overflow-hidden">
        <Crosshairs />
        <div className="mx-auto max-w-7xl px-6 lg:px-10 flex items-center justify-center">
          <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] italic font-light text-[#FAFAFA]/10 select-none tracking-tight">
            Surakshya
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
                    <a
                      href={link.href}
                      className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors"
                    >
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
                    <a
                      href={link.href}
                      className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors"
                    >
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
                    <a
                      href={link.href}
                      className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors"
                    >
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
                    <a
                      href={link.href}
                      className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors"
                    >
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
                    <a
                      href={link.href}
                      className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors"
                    >
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
                <a
                  href="tel:+911234567890"
                  className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors"
                >
                  +91 123 456 7890
                </a>
                <a
                  href="mailto:hello@surakshya.com"
                  className="text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors"
                >
                  hello@surakshya.com
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
              <a
                href="#"
                aria-label="Facebook"
                className="text-[#888888] hover:text-[#FAFAFA] transition-colors"
              >
                <IconFacebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="text-[#888888] hover:text-[#FAFAFA] transition-colors"
              >
                <IconInstagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="text-[#888888] hover:text-[#FAFAFA] transition-colors"
              >
                <IconYoutube className="w-5 h-5" />
              </a>
            </div>
            <p className="text-xs text-[#888888]/60">
              {`\u00A9 ${new Date().getFullYear()} Surakshya. All rights reserved.`}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
