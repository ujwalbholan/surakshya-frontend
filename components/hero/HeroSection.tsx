"use client"

/**
 * HeroSection.tsx — Suraksha hero orchestrator
 *
 * Design direction: precision-instrument editorial.
 * Pure black field. Crimson surgical accents. 3D wristband as centrepiece.
 * Every layer has a defined purpose and z-index contract.
 *
 * Z-index contract (lowest → highest):
 *   0   Background atmosphere (radial glow, vignette)
 *   1   3D canvas (WristbandModel)
 *   10  TextPanels
 *   15  SectionIndicator
 *   18  FilmGrain (above content, below chrome)
 *   20  Top crimson bar
 *   25  Bottom fade
 *
 * State architecture:
 *   activeSectionIndex is a REF, not useState.
 *   TextPanels receives it as a ref and reads via a callback —
 *   avoids re-rendering the entire hero tree on every scroll event.
 *
 * Ref architecture:
 *   canvasWrapperRef lives HERE (the outer positioning div).
 *   WristbandModel manages its own internal canvas wrapper for its
 *   load animation. useHeroScroll targets the outer ref for scroll-out fade.
 *   The two are intentionally separate with no compound interference.
 */

import { useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import SectionIndicator from "./SectionIndicator"
import TextPanels from "./TextPanels"
import FilmGrain from "./FilmGrain"
import { useHeroScroll } from "@/hooks/useHeroScroll"
import type { WristbandModelRef } from "./WristbandModel"
import type { SectionIndicatorRefs } from "./SectionIndicator"

// ─── Dynamic imports ──────────────────────────────────────────────────────────

// Crosshairs loaded dynamically — decorative, non-blocking
const Crosshairs = dynamic(() => import("@/components/Crosshairs"), {
  ssr: false,
  loading: () => null,
})

// WristbandModel must be client-side only (WebGL)
const WristbandModel = dynamic(() => import("./WristbandModel"), {
  ssr: false,
  loading: () => (
    // Placeholder maintains layout space while Three.js loads
    <div style={{ width: "100%", height: "100%", background: "transparent" }} />
  ),
})

// ─── Background atmosphere ────────────────────────────────────────────────────

/**
 * Multi-layer background:
 * 1. Pure black base
 * 2. Subtle crimson radial bloom behind where the 3D model sits
 * 3. Radial vignette — darkens corners, focuses eye on centre
 *
 * All CSS, zero JS — no performance cost.
 */
function HeroAtmosphere() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Hard black base ensures hero never washes out to white */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#000000",
        }}
      />

      {/* Crimson radial bloom — sits behind the 3D model */}
      <div
        style={{
          position: "absolute",
          // Positioned right-of-centre where the wristband floats
          top: "50%",
          left: "58%",
          transform: "translate(-50%, -50%)",
          width: "60vw",
          height: "60vw",
          maxWidth: 800,
          maxHeight: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139, 26, 26, 0.24) 0%, rgba(192, 57, 43, 0.1) 38%, transparent 72%)",
          filter: "blur(56px)",
        }}
      />

      {/* Corner vignette — draws eye inward */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 34%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </div>
  )
}

// ─── Top crimson bar ──────────────────────────────────────────────────────────

/**
 * Brand marker at top of hero.
 * Gradient-edged, glowing — not a raw solid rectangle.
 */
function TopBar() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        zIndex: 20,
        pointerEvents: "none",
        // Fades in from left, solid centre, fades to right
        background:
          "linear-gradient(to right, transparent 0%, #c0392b 20%, #e74c3c 50%, #c0392b 80%, transparent 100%)",
        // Subtle glow below the line
        boxShadow: "0 0 12px 1px rgba(192, 57, 43, 0.4), 0 0 40px 4px rgba(192, 57, 43, 0.08)",
      }}
    />
  )
}

// ─── Bottom fade ──────────────────────────────────────────────────────────────

/**
 * Fades hero content into the next section.
 * Uses explicit #000000 — avoids Tailwind CSS variable resolution failure.
 */
function BottomFade() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        zIndex: 25,
        pointerEvents: "none",
        background:
          "linear-gradient(to top, #000000 0%, rgba(0,0,0,0.7) 35%, transparent 100%)",
      }}
    />
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export default function HeroSection() {
  // Scroll container — 500vh tall, ScrollTrigger pins inside this
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 3D model ref — useHeroScroll drives scroll-based rotation/scale
  const wristbandRef = useRef<WristbandModelRef>(null)

  // Left-side indicator — useHeroScroll drives number swap, progress fill, dots
  const sectionIndicatorRef = useRef<SectionIndicatorRefs | null>(null)

  /**
   * Outer canvas positioning div.
   * Separate from WristbandModel's internal canvasWrapperRef.
   * useHeroScroll targets this for scroll-out opacity fade (the whole 3D area).
   * WristbandModel's internal ref handles its own load-in animation.
   * The two never compound.
   */
  const canvasWrapperRef = useRef<HTMLDivElement>(null)

  /**
   * activeSectionRef — NOT useState.
   *
   * Using useState would trigger a full React reconciliation of the entire
   * hero subtree (WristbandModel, TextPanels, SectionIndicator, FilmGrain)
   * on every scroll event. At 60fps during a 500vh scroll that's thousands
   * of unnecessary re-renders.
   *
   * Instead: useHeroScroll calls onSectionChange(index) directly,
   * TextPanels reads via a stable callback ref.
   */
  const activeSectionRef = useRef<number>(0)
  const textPanelsSetActiveRef = useRef<((index: number) => void) | null>(null)

  const onSectionChange = useCallback((index: number) => {
    activeSectionRef.current = index
    // Directly call TextPanels' internal state setter — zero re-renders above
    textPanelsSetActiveRef.current?.(index)
  }, [])

  useHeroScroll({
    scrollContainerRef,
    wristbandRef,
    sectionIndicatorRef,
    canvasWrapperRef,
    onSectionChange,
  })

  return (
    <section
      id="hero"
      aria-label="Suraksha — The Guardian On Your Wrist"
      data-hero-section                    // ScrollTrigger hook targeting
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: "#000000",
      }}
    >
      {/* Skip link target for keyboard navigation */}
      <div id="hero-end" style={{ position: "absolute", bottom: 0 }} />

      {/* ── 500vh scroll container ── */}
      <div
        ref={scrollContainerRef}
        data-scroll-container
        style={{ height: "500vh", background: "#000000" }}
      >
        {/* ── Sticky viewport — everything visible lives here ── */}
        <div
          data-sticky-wrapper
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "clip",
            background: "#000000",
            isolation: "isolate",
          }}
        >

          {/* z:0 — Atmospheric background layers */}
          <HeroAtmosphere />

          {/* z:1 — 3D wristband canvas — full-bleed background layer */}
          <div
            ref={canvasWrapperRef}
            data-canvas-outer                // outer ref for scroll-fade
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background: "transparent",
            }}
          >
            <WristbandModel ref={wristbandRef} />
          </div>

          {/* z:10 — Text content panels (WELCOME, PROTECTION, etc.) */}
          <TextPanels
            setActiveRef={textPanelsSetActiveRef}
            initialIndex={0}
          />

          {/* z:15 — Left-side section indicator */}
          <SectionIndicator ref={sectionIndicatorRef} />

          {/* z:18 — Film grain overlay — above content, below chrome */}
          <FilmGrain />

          {/* z:20 — Top brand bar */}
          <TopBar />

          {/* z:25 — Bottom section fade */}
          <BottomFade />

          {/* Decorative crosshairs — lowest priority, loads async */}
          <Crosshairs />

        </div>
      </div>
    </section>
  )
}