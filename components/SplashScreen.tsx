"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"

/**
 * Cubic-bezier(0.4, 0, 0.2, 1) easing.
 * Maps linear time t in [0,1] to eased progress.
 * Uses Newton-Raphson to solve for t given x, then returns y(t).
 */
function cubicBezierEase(t: number, x1 = 0.4, y1 = 0, x2 = 0.2, y2 = 1): number {
  if (t <= 0) return 0
  if (t >= 1) return 1

  // Find parameter u such that x(u) = t using Newton-Raphson
  let u = t
  for (let i = 0; i < 8; i++) {
    const u2 = u * u
    const u3 = u2 * u
    const u1 = 1 - u
    const u12 = u1 * u1

    const x = 3 * u12 * u * x1 + 3 * u1 * u2 * x2 + u3
    const dx = 3 * u12 * x1 + 6 * u1 * u * (x2 - x1) + 3 * u2 * (1 - x2)
    u = u - (x - t) / dx
    u = Math.max(0, Math.min(1, u))
  }

  // Return y(u)
  const u2 = u * u
  const u3 = u2 * u
  const u1 = 1 - u
  const u12 = u1 * u1
  return 3 * u12 * u * y1 + 3 * u1 * u2 * y2 + u3
}

const PROGRESS_DURATION_MS = 1800
const HOLD_DURATION_MS = 200
const BAR_FADE_DURATION_MS = 800
const OVERLAY_FADE_DURATION_MS = 600

const SKIP_SPLASH_PREFIXES = ["/dashboard", "/login", "/signup"]

export default function SplashScreen() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [barHidden, setBarHidden] = useState(false)
  const [overlayHidden, setOverlayHidden] = useState(false)
  const [shouldRender, setShouldRender] = useState(true)
  const rafIdRef = useRef<number | null>(null)
  const phaseRef = useRef<"progress" | "hold" | "barFade" | "overlayFade">("progress")

  useEffect(() => {
    const skipForRoute = SKIP_SPLASH_PREFIXES.some((p) => pathname?.startsWith(p))
    if (skipForRoute) {
      document.body.style.overflow = "auto"
      setShouldRender(false)
      return
    }

    // Respect prefers-reduced-motion: skip animation and remove immediately
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      document.body.style.overflow = "auto"
      setShouldRender(false)
      return
    }

    const startTime = performance.now()
    const holdEnd = PROGRESS_DURATION_MS + HOLD_DURATION_MS
    const barFadeEnd = holdEnd + BAR_FADE_DURATION_MS
    const overlayFadeEnd = barFadeEnd + OVERLAY_FADE_DURATION_MS

    const tick = (now: number) => {
      const elapsed = now - startTime

      if (phaseRef.current === "progress") {
        if (elapsed < PROGRESS_DURATION_MS) {
          const t = elapsed / PROGRESS_DURATION_MS
          const eased = cubicBezierEase(t)
          setProgress(eased * 100)
          rafIdRef.current = requestAnimationFrame(tick)
        } else {
          setProgress(100)
          phaseRef.current = "hold"
          rafIdRef.current = requestAnimationFrame(tick)
        }
      } else if (phaseRef.current === "hold") {
        if (elapsed < holdEnd) {
          rafIdRef.current = requestAnimationFrame(tick)
        } else {
          phaseRef.current = "barFade"
          setBarHidden(true)
          rafIdRef.current = requestAnimationFrame(tick)
        }
      } else if (phaseRef.current === "barFade") {
        if (elapsed < barFadeEnd) {
          rafIdRef.current = requestAnimationFrame(tick)
        } else {
          phaseRef.current = "overlayFade"
          setOverlayHidden(true)
          rafIdRef.current = requestAnimationFrame(tick)
        }
      } else if (phaseRef.current === "overlayFade") {
        if (elapsed < overlayFadeEnd) {
          rafIdRef.current = requestAnimationFrame(tick)
        } else {
          document.body.style.overflow = "auto"
          setShouldRender(false)
        }
      }
    }

    rafIdRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
      document.body.style.overflow = "auto"
    }
  }, [pathname])

  if (!shouldRender) return null

  return (
    <div
      aria-hidden="true"
      className="splash-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: overlayHidden ? 0 : 1,
        transition: "opacity 0.6s ease-in-out",
      }}
    >
      <div
        className="splash-bar-wrapper"
        style={{
          opacity: barHidden ? 0 : 1,
          transition: "opacity 0.8s ease-in-out",
        }}
      >
        <div
          className="splash-track"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            width: "min(580px, 80vw)",
            height: 2,
            background: "#1a1a1a",
            overflow: "hidden",
          }}
        >
          <div
            className="splash-fill"
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#ffffff",
              boxShadow: "0 0 8px rgba(255,255,255,0.4)",
            }}
          />
        </div>
      </div>
    </div>
  )
}
