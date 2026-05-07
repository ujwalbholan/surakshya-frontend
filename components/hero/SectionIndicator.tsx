"use client"

/**
 * SectionIndicator.tsx — Left-side vertical section map (lightweight.info style)
 *
 * All 5 sections displayed vertically, distributed down the left side.
 * Active section: #ffffff, opacity 1. Inactive: #333333, opacity 0.5.
 * GSAP drives active/inactive styling on section change.
 */

import React, { useRef, forwardRef, useImperativeHandle } from "react"

// ─── Data ────────────────────────────────────────────────────────────────────

export interface Section {
  number: string
  label: string
  shortLabel: string
}

export const sections: Section[] = [
  { number: "01", label: "WELCOME", shortLabel: "Welcome" },
  { number: "02", label: "PROTECTION", shortLabel: "Protection" },
  { number: "03", label: "TRACKING", shortLabel: "Tracking" },
  { number: "04", label: "SOS", shortLabel: "SOS" },
  { number: "05", label: "EVIDENCE", shortLabel: "Evidence" },
]

// ─── Ref shape ────────────────────────────────────────────────────────────────

export interface SectionIndicatorRefs {
  sectionRefs: React.RefObject<HTMLDivElement | null>[]
}

// ─── Component ────────────────────────────────────────────────────────────────

const SectionIndicator = forwardRef<SectionIndicatorRefs, object>(
  function SectionIndicator(_, ref) {
    const sectionRefs = sections.map(() => useRef<HTMLDivElement>(null))

    useImperativeHandle(ref, () => ({
      sectionRefs,
    }))

    return (
      <nav
        data-section-indicator
        role="navigation"
        aria-label="Section navigation"
        style={{
          position: "absolute",
          left: 24,
          top: 0,
          bottom: 0,
          zIndex: 15,
          pointerEvents: "none",
        }}
      >
        {sections.map((section, i) => (
          <div
            key={section.label}
            ref={sectionRefs[i]}
            data-section={i}
            style={{
              position: "absolute",
              top: `${15 + i * 18}%`,
              left: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span
              data-section-number
              style={{
                fontFamily: "'DM Mono', 'Courier New', monospace",
                fontSize: 10,
                letterSpacing: "0.15em",
                color: i === 0 ? "#ffffff" : "#333333",
                opacity: i === 0 ? 1 : 0.5,
                lineHeight: 1,
              }}
            >
              {section.number}
            </span>
            <span
              data-section-label
              style={{
                fontFamily: "'DM Mono', 'Courier New', monospace",
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: i === 0 ? "#ffffff" : "#333333",
                opacity: i === 0 ? 1 : 0.5,
                lineHeight: 1,
              }}
            >
              {section.label}
            </span>
          </div>
        ))}
      </nav>
    )
  }
)

SectionIndicator.displayName = "SectionIndicator"

export default SectionIndicator
