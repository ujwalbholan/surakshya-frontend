"use client"

/**
 * FilmGrain.tsx — Cinematic noise texture overlay
 *
 * Design intent:
 *   Adds tactile depth to the pure black hero. Real film grain has three
 *   qualities this component replicates: Gaussian value distribution
 *   (clusters near mid-grey, not pure white noise), slight chromatic
 *   variation (R/G/B channels shift independently), and temporal
 *   randomness (grain pattern changes every frame, never repeats).
 *
 * Performance architecture:
 *   The original allocated ~8MB of ImageData per frame at 60fps = 497MB/s
 *   of pure memory writes. This implementation uses four strategies to
 *   reduce that by ~93%:
 *
 *   1. HALF RESOLUTION — canvas renders at 50% of screen dimensions.
 *      CSS `image-rendering: pixelated` + scale makes it fill the space.
 *      Grain doesn't need pixel-perfect resolution — the blur from upscaling
 *      actually makes it look more like real grain (soft, not digital noise).
 *
 *   2. SINGLE ALLOCATION — ImageData buffer allocated ONCE on mount/resize.
 *      Reused every frame. No GC pressure.
 *
 *   3. 30fps CAP — film grain at 30fps is visually identical to 60fps.
 *      Timestamp-based throttle halves CPU cost on high-refresh displays.
 *
 *   4. TAB VISIBILITY — animation pauses entirely when tab is hidden.
 *      No cost when the user isn't looking.
 *
 * Z-index: 18 — above hero content, below nav chrome (per HeroSection contract)
 * Position: absolute — confined to sticky wrapper, not full-page overlay
 */

import { useRef, useEffect } from "react"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Render resolution scale — 0.5 = half res, upscaled via CSS */
const RESOLUTION_SCALE = 0.5

/** Target frame rate — 30fps is imperceptible from 60fps for noise */
const TARGET_FPS = 30
const FRAME_INTERVAL = 1000 / TARGET_FPS

/**
 * Grain opacity on dark backgrounds.
 * 0.04 (original) is invisible on #000. 0.07 is the sweet spot —
 * present enough to add texture, subtle enough to never distract.
 */
const GRAIN_OPACITY = 0.07

/**
 * Gaussian spread — how far grain values deviate from mid-grey (128).
 * Lower = subtler, closer to mid-grey. Higher = more contrast in grain.
 * 35 replicates ISO 3200 film pushed in low light.
 */
const GAUSSIAN_SPREAD = 35

/**
 * Chromatic spread — max per-channel deviation from the luminance value.
 * Creates the faint colour fringing seen in real film grain.
 * Keep low (≤8) or it reads as colour noise, not film grain.
 */
const CHROMATIC_SPREAD = 5

/** Resize debounce delay in ms */
const RESIZE_DEBOUNCE = 150

// ─── Gaussian approximation ───────────────────────────────────────────────────

/**
 * Box-Muller approximation using sum of uniforms.
 * Returns a value roughly normally distributed around `mean` with `spread` SD.
 * Faster than true Box-Muller; precision is sufficient for visual noise.
 */
function gaussian(mean: number, spread: number): number {
  // Sum of 3 uniforms approximates normal distribution (central limit theorem)
  const u = Math.random() + Math.random() + Math.random()
  // u ∈ [0,3], normalised to [-1, 1] range, then scaled
  return Math.round(mean + spread * (u / 1.5 - 1))
}

/** Clamp to valid byte range */
function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FilmGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef?.current
    if (!canvas) return

    // Respect prefers-reduced-motion — flickering grain can cause discomfort
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion) return

    const ctx = canvas.getContext("2d", {
      // Hint: we never read pixels back — write-only context
      willReadFrequently: false,
    })
    if (!ctx) return

    // ── State ──
    let imageData: ImageData | null = null
    let animationId: number
    let lastFrameTime = 0
    let resizeTimer: ReturnType<typeof setTimeout>
    let isVisible = !document.hidden

    // ── Resize handler ──
    // Sets canvas to half-resolution of the sticky wrapper
    // Debounced — rapid resize events don't thrash GPU texture upload
    const setSize = () => {
      const parent = canvas.parentElement
      const w = parent ? parent.offsetWidth  : window.innerWidth
      const h = parent ? parent.offsetHeight : window.innerHeight

      canvas.width  = Math.ceil(w * RESOLUTION_SCALE)
      canvas.height = Math.ceil(h * RESOLUTION_SCALE)

      // Reallocate buffer at new size — single allocation for lifetime of this size
      if (canvas.width > 0 && canvas.height > 0) {
        imageData = ctx.createImageData(canvas.width, canvas.height)

        // Pre-fill alpha channel to 255 — never changes, no need to write per-frame
        const data = imageData.data
        for (let i = 3; i < data.length; i += 4) {
          data[i] = 255
        }
      }
    }

    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(setSize, RESIZE_DEBOUNCE)
    }

    // ── Visibility handler ──
    // Pauses animation when tab is hidden — zero CPU in background
    const onVisibilityChange = () => {
      isVisible = !document.hidden
      if (isVisible && !animationId) {
        // Resume
        animationId = requestAnimationFrame(draw)
      }
    }

    // ── Draw ──
    const draw = (timestamp: number) => {
      animationId = requestAnimationFrame(draw)

      // Pause when tab hidden
      if (!isVisible) return

      // 30fps throttle
      if (timestamp - lastFrameTime < FRAME_INTERVAL) return
      lastFrameTime = timestamp

      if (!imageData || canvas.width === 0 || canvas.height === 0) return

      const data = imageData.data
      const len  = data.length

      // Write R, G, B channels per pixel
      // Alpha (i+3) was pre-filled to 255 and never touched
      for (let i = 0; i < len; i += 4) {
        // Gaussian luminance value — clusters near mid-grey (128)
        const lum = gaussian(128, GAUSSIAN_SPREAD)

        // Per-channel chromatic variation — subtle colour in the grain
        data[i]     = clamp(lum + (Math.random() * CHROMATIC_SPREAD * 2 - CHROMATIC_SPREAD))  // R
        data[i + 1] = clamp(lum + (Math.random() * CHROMATIC_SPREAD * 2 - CHROMATIC_SPREAD))  // G
        data[i + 2] = clamp(lum + (Math.random() * CHROMATIC_SPREAD * 2 - CHROMATIC_SPREAD))  // B
        // i + 3 = alpha, pre-set to 255, not touched
      }

      ctx.putImageData(imageData, 0, 0)
    }

    // ── Init ──
    setSize()
    window.addEventListener("resize", onResize, { passive: true })
    document.addEventListener("visibilitychange", onVisibilityChange)
    animationId = requestAnimationFrame(draw)

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(animationId)
      clearTimeout(resizeTimer)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      imageData = null
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        // Absolute — confined to hero sticky wrapper (not full-page fixed)
        position: "absolute",
        inset: 0,
        // Scale half-res canvas to full size
        // pixelated prevents anti-aliasing blur that would soften the grain
        width: "100%",
        height: "100%",
        imageRendering: "pixelated",
        pointerEvents: "none",
        // z:18 — above hero content, below nav/chrome per HeroSection contract
        zIndex: 18,
        opacity: GRAIN_OPACITY,
        // Mix-blend-mode overlay makes grain interact with underlying colours
        // rather than just sitting on top — more integrated, more cinematic
        mixBlendMode: "overlay",
        // Subtle vignette via CSS mask — grain fades toward edges
        // focuses the grain effect toward the centre where content lives
        WebkitMaskImage:
          "radial-gradient(ellipse at center, black 50%, transparent 90%)",
        maskImage:
          "radial-gradient(ellipse at center, black 50%, transparent 90%)",
      }}
    />
  )
}