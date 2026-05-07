"use client"

/**
 * TextPanels.tsx — Hero section content panels for Suraksha
 *
 * Design direction: Editorial luxury-safety — think Aesop meets Dyson.
 * Left-aligned asymmetric layout. Thin display typography. Precise motion.
 * Each panel tells a story chapter; transitions feel like turning pages.
 *
 * Senior notes:
 * - GSAP timeline per panel, killed on deactivation — no tween conflicts
 * - Opacity driven ONLY by GSAP — no CSS transition double-driving
 * - reducedMotion computed once at module level, not inside callbacks
 * - Semantic manual line breaks per section — not a character-count algorithm
 * - WCAG AA compliant contrast on all text
 * - will-change: transform on animated lines — GPU compositing
 */

import React, { useRef, useEffect, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { sections, type Section } from "./SectionIndicator"

// ─── Reduced motion — computed once ──────────────────────────────────────────

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

// ─── Panel content ────────────────────────────────────────────────────────────
// Line breaks are SEMANTIC — crafted per heading for ideal rhythm at large size.
// Format: array of strings = one string per visual line.

interface PanelContent {
  eyebrow: string
  lines: string[]       // heading split into display lines
  subtext: string
  hasCta?: boolean
}

const PANELS: Record<string, PanelContent> = {
  WELCOME: {
    eyebrow: "01 — Welcome",
    lines: ["The Evolution", "Of Safety"],
    subtext:
      "Suraksha is a women's safety IoT wristband. One tap sends your live GPS location to family and emergency contacts — instantly, silently, reliably.",
    hasCta: true,
  },
  PROTECTION: {
    eyebrow: "02 — Protection",
    lines: ["Built for the", "Unexpected"],
    subtext:
      "Aerospace-grade materials. Bluetooth 5.0 BLE. Waterproof to IP67. Designed to be forgotten on the wrist — until the moment it matters most.",
  },
  TRACKING: {
    eyebrow: "03 — Tracking",
    lines: ["Live Location.", "Always On."],
    subtext:
      "Real-time GPS lets trusted contacts follow your route. Share a live commute, a late walk, a late night — and arrive knowing someone always knows.",
  },
  SOS: {
    eyebrow: "04 — SOS",
    lines: ["One Tap.", "Instant Help."],
    subtext:
      "A single press dispatches your live coordinates to emergency contacts and authorities. No phone required. No delay. No second chances needed.",
  },
  EVIDENCE: {
    eyebrow: "05 — Evidence",
    lines: ["Capture", "Everything."],
    subtext:
      "SOS auto-triggers encrypted audio and location recording. Evidence is securely stored and shareable with law enforcement — timestamped, tamper-proof.",
  },
}

// ─── Easing ───────────────────────────────────────────────────────────────────

const EASE_IN  = "cubic-bezier(0.4, 0, 1, 1)"
const EASE_OUT = "cubic-bezier(0, 0, 0.2, 1)"
const EASE_EXPO_OUT = "expo.out"

// ─── Panel ────────────────────────────────────────────────────────────────────

interface PanelProps {
  section: Section
  index: number
  isActive: boolean
  isWelcome: boolean
}

function Panel({ section, index, isActive, isWelcome }: PanelProps) {
  const panelRef      = useRef<HTMLDivElement>(null)
  const timelineRef   = useRef<gsap.core.Timeline | null>(null)
  const content       = PANELS[section.label]

  // ── Entry animation ──
  // Triggered when isActive flips true.
  // Kills previous timeline to prevent ghost tweens on rapid scroll.
  useEffect(() => {
    if (!panelRef.current || !isActive) return
    const el = panelRef.current

    // Kill any running timeline on this panel
    timelineRef.current?.kill()

    // Immediately make panel visible (GSAP owns opacity — no CSS transition)
    gsap.set(el, { opacity: 1 })

    if (prefersReducedMotion) return

    // WELCOME panel waits for splash + hero load sequence
    const entryDelay = isWelcome ? 1.8 : 0.05

    const tl = gsap.timeline({ delay: entryDelay })
    timelineRef.current = tl

    // Eyebrow fade-up
    const eyebrow = el.querySelector("[data-eyebrow]")
    if (eyebrow) {
      tl.fromTo(
        eyebrow,
        { opacity: 0, y: 12, filter: "blur(4px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: EASE_OUT },
        0
      )
    }

    // Heading lines — staggered mask reveal
    const lines = el.querySelectorAll("[data-line-inner]")
    if (lines.length) {
      tl.fromTo(
        lines,
        { y: "105%", opacity: 0 },
        {
          y: "0%",
          opacity: 1,
          duration: 0.75,
          stagger: 0.1,
          ease: EASE_EXPO_OUT,
        },
        eyebrow ? 0.15 : 0
      )
    }

    // Subtext — fade + slight rise
    const sub = el.querySelector("[data-subtext]")
    if (sub) {
      tl.fromTo(
        sub,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: EASE_OUT },
        0.45
      )
    }

    // CTA — appears last
    const cta = el.querySelector("[data-cta]")
    if (cta) {
      tl.fromTo(
        cta,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: EASE_OUT },
        0.75
      )
    }

    // Red accent line — draws in from left
    const accent = el.querySelector("[data-accent-line]")
    if (accent) {
      tl.fromTo(
        accent,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: EASE_EXPO_OUT, transformOrigin: "left center" },
        0.1
      )
    }

    return () => { tl.kill() }
  }, [isActive, isWelcome])

  // ── Exit animation ──
  useEffect(() => {
    if (!panelRef.current || isActive) return
    const el = panelRef.current

    timelineRef.current?.kill()

    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 0 })
      return
    }

    // Fade out fast — make room for incoming panel
    gsap.to(el, {
      opacity: 0,
      duration: 0.25,
      ease: EASE_IN,
      onComplete: () => {
        // Reset inner elements for clean re-entry
        const lines = el.querySelectorAll("[data-line-inner]")
        gsap.set(lines, { y: "105%", opacity: 0 })
        const eyebrow = el.querySelector("[data-eyebrow]")
        if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 12, filter: "blur(4px)" })
        const sub = el.querySelector("[data-subtext]")
        if (sub) gsap.set(sub, { opacity: 0, y: 16 })
        const cta = el.querySelector("[data-cta]")
        if (cta) gsap.set(cta, { opacity: 0 })
        const accent = el.querySelector("[data-accent-line]")
        if (accent) gsap.set(accent, { scaleX: 0 })
      },
    })
  }, [isActive])

  if (!content) return null

  return (
    <div
      ref={panelRef}
      data-text-panel={section.label}
      aria-hidden={!isActive}
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0,                   // GSAP drives — never CSS transition
        pointerEvents: isActive ? "auto" : "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: isWelcome ? "center" : "flex-start",
        alignItems: isWelcome ? "center" : "flex-start",
        textAlign: isWelcome ? "center" : "left",
        paddingLeft: isWelcome ? "clamp(20px, 4vw, 60px)" : "clamp(60px, 8vw, 140px)",
        paddingRight: isWelcome ? "clamp(20px, 4vw, 60px)" : "clamp(40px, 8vw, 120px)",
        paddingTop: isWelcome ? "clamp(42px, 8vh, 84px)" : "9vh",
      }}
    >
      <div
        style={{
          width: isWelcome ? "min(78vw, 720px)" : "min(56vw, 720px)",
          padding: isWelcome ? "clamp(8px, 1.4vw, 14px)" : "clamp(18px, 2.2vw, 30px)",
          background: isWelcome
            ? "transparent"
            : "linear-gradient(135deg, rgba(0,0,0,0.46) 0%, rgba(0,0,0,0.18) 100%)",
          border: isWelcome ? "none" : "1px solid rgba(255,255,255,0.06)",
          backdropFilter: isWelcome ? "none" : "blur(3px)",
          WebkitBackdropFilter: isWelcome ? "none" : "blur(3px)",
        }}
      >
        {/* Red accent line — draws in on entry */}
        <div
          data-accent-line
          style={{
            width: 44,
            height: 1,
            background: "#c0392b",
            marginBottom: 22,
            marginLeft: isWelcome ? "auto" : 0,
            marginRight: isWelcome ? "auto" : 0,
            transformOrigin: "left center",
            transform: "scaleX(0)",
          }}
        />

      {/* Eyebrow — section identifier */}
      <p
        data-eyebrow
        data-hero-eyebrow
        style={{
          fontFamily: "'DM Mono', 'Courier New', monospace",
          fontSize: "clamp(10px, 1vw, 12px)",
          letterSpacing: "0.22em",
          color: "#c0392b",
          textTransform: "uppercase",
          marginBottom: isWelcome ? 20 : 28,
          opacity: 0,
          fontWeight: 400,
        }}
      >
        {isWelcome ? "Welcome" : content.eyebrow}
      </p>

      {/* Heading — mask reveal per line */}
      <h2
        style={{
          margin: 0,
          padding: 0,
          lineHeight: isWelcome ? 0.96 : 1.02,
        }}
      >
        {content.lines.map((line, i) => (
          <span
            key={i}
            style={{
              display: "block",
              overflow: "hidden",
              // Slight negative margin between lines for tight leading
              marginBottom: i < content.lines.length - 1 ? "0.05em" : 0,
            }}
          >
            <span
              data-line-inner
              data-hero-line
              style={{
                display: "block",
                maxWidth: "none",
                fontSize: isWelcome
                  ? "clamp(42px, 6vw, 84px)"
                  : "clamp(56px, 8vw, 120px)",
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                fontWeight: isWelcome ? 500 : 400,
                letterSpacing: isWelcome ? "0.02em" : "-0.02em",
                textTransform: isWelcome ? "uppercase" : "none",
                color: isWelcome ? "#f8f8f8" : "#ffffff",
                textShadow: isWelcome
                  ? "0 3px 10px rgba(0,0,0,0.35)"
                  : "0 10px 30px rgba(0,0,0,0.65)",
                willChange: "transform",            // GPU layer for smooth animation
                transform: "translateY(105%)",      // initial state for GSAP
                opacity: 0,
              }}
            >
              {line}
            </span>
          </span>
        ))}
      </h2>

      {/* Subtext */}
      {!isWelcome && (
        <p
          data-subtext
          style={{
            marginTop: "clamp(20px, 3vw, 36px)",
            maxWidth: "clamp(280px, 38vw, 520px)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: "clamp(13px, 1.2vw, 16px)",
            lineHeight: 1.75,
            color: "#c2c2c2",
            fontWeight: 350,
            letterSpacing: "0.01em",
            opacity: 0,
          }}
        >
          {content.subtext}
        </p>
      )}

      {/* CTA — WELCOME panel only */}
        {content.hasCta && (
          <div
            data-cta
            style={{
              marginTop: isWelcome ? "clamp(26px, 3.4vw, 40px)" : "clamp(32px, 5vw, 56px)",
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: 0,
              cursor: "default",
              alignSelf: isWelcome ? "flex-start" : "center",
              marginLeft: isWelcome ? "clamp(24px, 6vw, 56px)" : 0,
            }}
          >
            <a
              href="#philosophy"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 132,
                height: 42,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.42)",
                color: "#f3f3f3",
                fontFamily: "'DM Mono', 'Courier New', monospace",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontWeight: 500,
                transition: "all 220ms ease",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(192,57,43,0.22)"
                e.currentTarget.style.borderColor = "rgba(192,57,43,0.55)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.42)"
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"
              }}
            >
              Learn More
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

interface TextPanelsProps {
  /** Ref to register the setter — parent calls ref.current(index) to update active panel without re-rendering parent */
  setActiveRef?: React.RefObject<((index: number) => void) | null>
  /** Initial active panel index (default 0) */
  initialIndex?: number
}

export default function TextPanels({ setActiveRef, initialIndex = 0 }: TextPanelsProps) {
  const [activeSectionIndex, setActiveSectionIndex] = useState(initialIndex)

  useEffect(() => {
    if (!setActiveRef) return
    setActiveRef.current = setActiveSectionIndex
    return () => {
      setActiveRef.current = null
    }
  }, [setActiveRef])

  return (
    // z-10 — above 3D canvas, below nav
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {sections.map((section, i) => (
        <Panel
          key={section.label}
          section={section}
          index={i}
          isActive={i === activeSectionIndex}
          isWelcome={section.label === "WELCOME"}
        />
      ))}
    </div>
  )
}