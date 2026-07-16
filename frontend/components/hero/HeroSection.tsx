"use client"

/**
 * HeroSection.tsx — Surakshya hero orchestrator
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

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

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

function HeroText() {
  // Start visible so SSR / first paint never white-on-black blank.
  // Mount effect only drives the progressive fade-in motion.
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setAnimated(true)
      return
    }
    const t = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const motionReady = animated

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 5vw",
      }}
    >
      {/* Left-side vertical label */}
      <div
        style={{
          position: "absolute",
          left: 22,
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          transformOrigin: "center center",
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: motionReady ? 0.38 : 0,
          transition: "opacity 1.2s ease 1.2s",
        }}
      >
        <div style={{ width: 24, height: 1, background: "rgba(255,255,255,0.3)" }} />
        <span
          style={{
            fontFamily: "'DM Mono', ui-monospace, monospace",
            fontSize: 8,
            letterSpacing: "0.28em",
            color: "rgba(255,255,255,0.6)",
            textTransform: "uppercase",
          }}
        >
          GUARDIAN SERIES
        </span>
      </div>

      {/* Main heading — always readable; motion is progressive enhancement */}
      <div
        style={{
          maxWidth: 560,
          opacity: 1,
          transform: motionReady ? "translateY(0)" : "translateY(18px)",
          transition: "transform 1s ease 0.15s",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 28,
              height: 1.5,
              background: "linear-gradient(to right, #cc0000, #ff3344)",
              borderRadius: 1,
            }}
          />
          <span
            style={{
              fontFamily: "'DM Mono', ui-monospace, monospace",
              fontSize: 10,
              letterSpacing: "0.3em",
              color: "#cc2233",
              textTransform: "uppercase",
            }}
          >
            Surakshya — SRK‑X1
          </span>
        </div>

        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-bebas), 'Bebas Neue', 'Impact', 'Arial Black', sans-serif",
            fontSize: "clamp(52px, 8vw, 96px)",
            lineHeight: 0.92,
            letterSpacing: "-0.01em",
            color: "#ffffff",
            fontWeight: 900,
          }}
        >
          <span style={{ display: "block" }}>THE GUARDIAN</span>
          <span
            style={{
              display: "block",
              WebkitTextStroke: "1px rgba(255,255,255,0.55)",
              color: "transparent",
            }}
          >
            ON YOUR WRIST
          </span>
        </h1>

        <p
          style={{
            marginTop: 20,
            maxWidth: 340,
            fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
            fontSize: 13,
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.01em",
            opacity: 1,
          }}
        >
          Military-grade SOS, real-time GPS, and an AI co-pilot engineered for
          the moments that matter most.
        </p>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 28,
            marginTop: 28,
            opacity: 1,
          }}
        >
          {[
            { value: "0.8s", label: "SOS response" },
            { value: "14d", label: "Battery life" },
            { value: "IP68", label: "Water proof" },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                style={{
                  fontFamily: "var(--font-bebas), 'Bebas Neue', 'Impact', sans-serif",
                  fontSize: 28,
                  lineHeight: 1,
                  color: "#ff3344",
                  letterSpacing: "0.04em",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', ui-monospace, monospace",
                  fontSize: 8,
                  letterSpacing: "0.22em",
                  color: "rgba(255,255,255,0.3)",
                  textTransform: "uppercase",
                  marginTop: 3,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Corner accent — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: 56,
          right: "5vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
          opacity: 0.45,
          transition: "opacity 1.2s ease 1.4s",
        }}
      >
        <div
          style={{
            fontFamily: "'DM Mono', ui-monospace, monospace",
            fontSize: 8,
            letterSpacing: "0.24em",
            color: "rgba(255,255,255,0.55)",
            textTransform: "uppercase",
          }}
        >
          Scroll to explore
        </div>
        <div
          style={{
            width: 38,
            height: 1,
            background:
              "linear-gradient(to left, rgba(255,255,255,0.4), transparent)",
            alignSelf: "stretch",
          }}
        />
      </div>

      {/* Right-side rule line */}
      <div
        style={{
          position: "absolute",
          right: "5vw",
          top: "50%",
          transform: "translateY(-50%)",
          width: 1,
          height: "28vh",
          background:
            "linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)",
          opacity: 1,
        }}
      />
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export default function HeroSection() {
  return (
    <section
      id="hero"
      aria-label="Surakshya — The Guardian On Your Wrist"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#000000",
        isolation: "isolate",
      }}
    >
      {/* Skip link target for keyboard navigation */}
      <div id="hero-end" style={{ position: "absolute", bottom: 0 }} />

      {/* z:0 — Atmospheric background layers */}
      <HeroAtmosphere />

      {/* z:1 — 3D wristband canvas — full-bleed background layer */}
      <div
        data-canvas-outer
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: "transparent",
        }}
      >
        <WristbandModel />
      </div>

      <HeroText />

      {/* z:20 — Top brand bar */}
      <TopBar />

      {/* z:25 — Bottom section fade */}
      <BottomFade />

      {/* Decorative crosshairs — lowest priority, loads async */}
      <Crosshairs />
    </section>
  )
}