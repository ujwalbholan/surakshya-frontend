"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X, Search } from "lucide-react"
import { LiquidButton } from "@/components/ui/liquid-glass-button"

const featuresItems = [
  { label: "One Tap SOS", href: "#innovation" },
  { label: "Live Tracking", href: "#product" },
  { label: "Safe Walk", href: "#product" },
  { label: "IoT Band", href: "#craft" },
  { label: "Evidence Capture", href: "#innovation" },
]

const technologyItems = [
  { label: "IoT Hardware", href: "#craft" },
  { label: "Bluetooth 5.0", href: "#craft" },
  { label: "GPS Tracking", href: "#innovation" },
]

const aboutItems = [
  { label: "About Us", href: "#philosophy" },
  { label: "Technology", href: "#craft" },
  { label: "Our Mission", href: "#brand" },
  { label: "Contact", href: "#newsletter" },
]

const CLOSE_DELAY_MS = 100
const NAV_HEIGHT = 70
const PANEL_WIDTH = 285
const PREVIEW_IMAGE_LEFT = 285

type NavDropdownProps = {
  label: string
  categoryLabel: string
  items: { label: string; href: string }[]
  previewImage: string
}

/**
 * Lightweight-style dropdown: left-side panel on hover.
 * Opens below nav bar, flush left, ~285px wide.
 * Right side shows full-height preview image (desktop only).
 * Closes when mouse leaves both trigger and panel (with 100ms delay).
 */
function NavDropdown({ label, categoryLabel, items, previewImage }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleClose = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS)
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const handleTriggerEnter = () => {
    cancelClose()
    setIsOpen(true)
  }

  const handleTriggerLeave = () => {
    scheduleClose()
  }

  const handlePanelEnter = () => {
    cancelClose()
    setIsOpen(true)
  }

  const handlePanelLeave = () => {
    scheduleClose()
  }

  // Escape key closes dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onMouseEnter={handleTriggerEnter}
        onMouseLeave={handleTriggerLeave}
        className="group flex items-center gap-1 text-[11px] font-light uppercase tracking-[0.15em] text-[var(--nav-text)]"
      >
        {/* Bullet: slides in from right to left (emerges from text) */}
        <span
          className="inline-block transition-all duration-200 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
          aria-hidden
        >
          •
        </span>
        {/* Text: shifts slightly right when bullet appears */}
        <span className="inline-block transition-transform duration-200 translate-x-0 group-hover:translate-x-1">
          {label}
        </span>
      </button>

      {/* Dropdown overlay: panel + preview image. Same height as image (55vh). */}
      <div
        role="menu"
        onMouseEnter={handlePanelEnter}
        onMouseLeave={handlePanelLeave}
        style={{
          position: "fixed",
          left: 0,
          top: NAV_HEIGHT,
          right: 0,
          height: "55vh",
          pointerEvents: isOpen ? "auto" : "none",
          zIndex: 999,
        }}
      >
        {/* Preview image: right side (z-index 999), reduced height, hidden on mobile */}
        <div
          className="hidden lg:block absolute top-0 right-0"
          style={{
            left: PREVIEW_IMAGE_LEFT,
            height: "55vh",
            opacity: isOpen ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <div className="relative h-full w-full">
            <Image
              src={previewImage}
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 0px, 100vw"
            />
            {/* Left-edge gradient for blend with panel */}
            <div
              className="absolute inset-y-0 left-0 w-24"
              style={{
                background: "linear-gradient(to right, rgba(0,0,0,0.4), transparent)",
              }}
            />
          </div>
        </div>

        {/* Left-side text panel (z-index 1000, above image) - same height as image */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: PANEL_WIDTH,
            height: "55vh",
            background: "var(--nav-dropdown-bg)",
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "translateY(0)" : "translateY(-8px)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
            zIndex: 1000,
          }}
        >
        <div className="pt-[90px] pl-6">
          {/* Category heading - positioned lower for breathing room */}
          <p
            className="mb-6 text-[14px] font-normal text-[var(--nav-dropdown-heading)]"
            style={{ textTransform: "none" }}
          >
            {categoryLabel}
          </p>
          {/* Sub-items - 32-36px spacing, muted gray */}
          <ul className="flex flex-col" style={{ lineHeight: "34px" }}>
            {items.map((item) => (
              <li key={item.label} role="none">
                <a
                  href={item.href}
                  role="menuitem"
                  className="block text-[11px] font-light uppercase tracking-[0.12em] text-[var(--nav-text-muted)] transition-colors duration-200 hover:text-[#ffffff]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Nav link with bullet on hover (for non-dropdown items).
 */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="group flex items-center gap-1 text-[11px] font-light uppercase tracking-[0.15em] text-[var(--nav-text)]"
    >
      {/* Bullet: slides in from right to left (emerges from text) */}
      <span
        className="inline-block transition-all duration-200 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
        aria-hidden
      >
        •
      </span>
      {/* Text: shifts slightly right when bullet appears */}
      <span className="inline-block transition-transform duration-200 translate-x-0 group-hover:translate-x-1">
        {children}
      </span>
    </a>
  )
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-[70px] bg-[var(--nav-bg)]"
        style={{ height: NAV_HEIGHT }}
      >
        <div className="flex h-full w-full items-center px-6 lg:px-10">
          {/* Logo: italic serif, left */}
          <a
            href="#"
            className="font-serif text-xl italic text-[var(--nav-text)] flex-shrink-0"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Suraksha
          </a>

          {/* Desktop Nav: centered */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
            <NavDropdown
              label="Features"
              categoryLabel="Features"
              items={featuresItems}
              previewImage="/images/social-1.jpg"
            />
            <NavDropdown
              label="Technology"
              categoryLabel="Technology"
              items={technologyItems}
              previewImage="/images/craft.jpg"
            />
            <NavDropdown
              label="About"
              categoryLabel="About"
              items={aboutItems}
              previewImage="/images/philosophy.jpg"
            />
            <NavLink href="#newsletter">Contact</NavLink>
          </div>

          {/* Search pill + mobile hamburger, right */}
          <div className="flex flex-shrink-0 items-center gap-4">
            {/* Login button - desktop only */}
            <Link href="/login" className="hidden lg:inline-flex">
              <LiquidButton
                size="sm"
                className="h-10 rounded-full px-6 text-[11px] font-light uppercase tracking-[0.15em] text-white"
              >
                Login
              </LiquidButton>
            </Link>

            {/* Search pill - desktop only */}
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 border border-[#333] rounded-full">
              <Search className="w-3.5 h-3.5 text-[var(--nav-text-muted)]" />
              <input
                type="search"
                placeholder="Search"
                aria-label="Search"
                className="w-24 bg-transparent text-[11px] font-light uppercase tracking-[0.15em] text-[var(--nav-text)] placeholder:text-[var(--nav-text-muted)] outline-none"
              />
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-[var(--nav-text)]"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-all duration-500 ${
          mobileOpen ? "visible" : "invisible"
        }`}
      >
        <div
          className={`absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-500 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />

        <div
          className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-[var(--nav-bg)] border-l border-[#222] transform transition-transform duration-500 ease-out ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-6 border-b border-[#222]">
            <span
              className="font-serif text-xl italic text-[var(--nav-text)]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Suraksha
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-[var(--nav-text)]"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-6">
            <div>
              <p className="text-[14px] text-[var(--nav-dropdown-heading)] mb-3">
                Features
              </p>
              {featuresItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block py-2 text-[11px] uppercase tracking-[0.12em] text-[var(--nav-text-muted)] hover:text-[#ffffff] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="border-t border-[#222] pt-6">
              <p className="text-[14px] text-[var(--nav-dropdown-heading)] mb-3">
                Technology
              </p>
              {technologyItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block py-2 text-[11px] uppercase tracking-[0.12em] text-[var(--nav-text-muted)] hover:text-[#ffffff] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="border-t border-[#222] pt-6">
              <p className="text-[14px] text-[var(--nav-dropdown-heading)] mb-3">
                About
              </p>
              {aboutItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block py-2 text-[11px] uppercase tracking-[0.12em] text-[var(--nav-text-muted)] hover:text-[#ffffff] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="border-t border-[#222] pt-6">
              <Link
                href="/login"
                className="inline-flex"
                onClick={() => setMobileOpen(false)}
              >
                <LiquidButton
                  size="sm"
                  className="h-10 rounded-full px-5 text-[11px] uppercase tracking-[0.12em] text-white"
                >
                  Login
                </LiquidButton>
              </Link>
              <a
                href="#newsletter"
                className="block py-2 text-[11px] uppercase tracking-[0.12em] text-[var(--nav-text-muted)] hover:text-[#ffffff] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
