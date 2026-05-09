"use client"

import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  Suspense,
  useState,
  useCallback,
  useMemo,
} from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF, Environment, useProgress } from "@react-three/drei"
import * as THREE from "three"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

// ─── Constants ────────────────────────────────────────────────────────────────

const WRISTBAND_GLB_PATH = "/models/wristband.glb"
// Keep procedural mode as default; enable only when GLB exists in /public/models/.
const USE_GLB_MODEL = false

const ANIM = {
  ROTATION_SPEED:      0.003,   // rad/frame — ~0.4 RPM slow drift
  BREATHE_AMPLITUDE:   0.08,    // units — vertical float distance
  BREATHE_FREQUENCY:   0.5,     // Hz — slower = more cinematic (~12s cycle)
  MOUSE_X:             0.3,     // max horizontal parallax shift
  MOUSE_Y:             0.2,     // max vertical parallax shift
  LERP_MOUSE:          0.04,    // lower = more lag, more cinematic
  LERP_MOBILE:         0.08,    // breathe lerp on mobile
  ENTRY_SCALE_FROM:    0.78,    // entry animation start scale
  ENTRY_DURATION:      1.6,     // entry animation duration (s)
  ENTRY_DELAY:         0.5,     // delay after splash screen ends (s)
  CANVAS_FADE_DUR:     1.2,     // wrapper fade-in duration (s)
  CANVAS_FADE_DELAY:   0.2,     // wrapper fade-in delay (s)
} as const

const MOBILE_BREAKPOINT = 768

// ─── Types ────────────────────────────────────────────────────────────────────

export type WristbandModelRef = {
  group: THREE.Group | null
}

type Vec2 = { x: number; y: number }

// ─── Loading Overlay ──────────────────────────────────────────────────────────

/**
 * Elegant loading state that exactly matches the pure black (#000000) hero.
 * Shows a thin white progress bar (mirrors the splash screen aesthetic).
 * Fades out seamlessly when Three.js reports 100% load progress.
 */
function CanvasLoader() {
  const { progress, active, loaded, total } = useProgress()
  const overlayRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  // Animate bar fill with each progress update
  useEffect(() => {
    if (!barRef.current) return
    gsap.to(barRef.current, {
      scaleX: progress / 100,
      duration: 0.4,
      ease: "power2.out",
      transformOrigin: "left center",
    })
  }, [progress])

  // Fade out overlay on completion
  useEffect(() => {
    if (progress < 100 || !overlayRef.current) return
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.7,
      ease: "power2.inOut",
      delay: 0.1,
      onComplete: () => {
        if (overlayRef.current) overlayRef.current.style.display = "none"
      },
    })
  }, [progress])

  // If nothing is being loaded (fallback path), hide loader immediately.
  useEffect(() => {
    if (!overlayRef.current) return
    const noResourcesToLoad = !active && loaded === 0 && total === 0
    if (!noResourcesToLoad) return
    overlayRef.current.style.display = "none"
  }, [active, loaded, total])

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {/* Thin progress bar — same language as splash screen */}
      <div
        style={{
          width: 120,
          height: 1,
          background: "#1a1a1a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          ref={barRef}
          style={{
            position: "absolute",
            inset: 0,
            background: "#ffffff",
            transformOrigin: "left center",
            transform: "scaleX(0)",
          }}
        />
      </div>
    </div>
  )
}

// ─── Fallback Torus ───────────────────────────────────────────────────────────

/**
 * Procedural wristband-shaped stand-in shown until wristband.glb is present.
 * Two rings: dark metallic outer + thin red emissive inner accent.
 *
 * Geometry & materials created with useMemo (stable refs) and
 * explicitly disposed on unmount to prevent GPU memory leaks.
 */
function FallbackTorus({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  const outerGeo = useMemo(() => new THREE.TorusGeometry(1.2, 0.18, 32, 128), [])
  const innerGeo = useMemo(() => new THREE.TorusGeometry(1.2, 0.035, 16, 128), [])

  const outerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a0d0d",
        metalness: 0.9,
        roughness: 0.12,
        emissive: "#a31919",
        emissiveIntensity: 0.35,
      }),
    []
  )

  const innerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ff3232",
        metalness: 0.4,
        roughness: 0.25,
        emissive: "#ff0000",
        emissiveIntensity: 1.25,
        transparent: true,
        opacity: 0.9,
      }),
    []
  )

  // Dispose GPU resources on unmount — critical for memory cleanup
  useEffect(() => {
    return () => {
      outerGeo.dispose()
      innerGeo.dispose()
      outerMat.dispose()
      innerMat.dispose()
    }
  }, [outerGeo, innerGeo, outerMat, innerMat])

  const TILT = Math.PI * 0.35

  return (
    <group ref={groupRef} position={[1.9, 0.05, 0]} scale={[1.28, 1.28, 1.28]}>
      <mesh geometry={outerGeo} material={outerMat} rotation={[TILT, 0, 0]} />
      <mesh geometry={innerGeo} material={innerMat} rotation={[TILT, 0, 0]} />
    </group>
  )
}

// ─── GLB Model ────────────────────────────────────────────────────────────────

/**
 * Loads and renders the actual wristband .glb.
 *
 * Key details:
 * - scene.clone(true) = deep clone so GLTF cache is NEVER mutated
 * - Each material is individually cloned before modification
 * - All cloned materials tracked and disposed on unmount
 */
function WristbandGLB({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  const { scene } = useGLTF(WRISTBAND_GLB_PATH)

  const { clonedScene, disposables } = useMemo(() => {
    const disposables: THREE.Material[] = []
    const clone = scene.clone(true)

    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh

      const processMat = (mat: THREE.Material): THREE.Material => {
        if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return mat
        // Clone material — never mutate the shared GLTF cache
        const m = (mat as THREE.MeshStandardMaterial).clone()
        m.color.set("#1c1c1c")
        m.metalness = 0.9
        m.roughness = 0.12
        m.envMapIntensity = 1.4
        m.needsUpdate = true
        disposables.push(m)
        return m
      }

      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(processMat)
        : processMat(mesh.material)
    })

    return { clonedScene: clone, disposables }
  }, [scene])

  // Dispose cloned materials on unmount — prevents VRAM leak
  useEffect(() => {
    return () => {
      disposables.forEach((mat) => mat.dispose())
    }
  }, [disposables])

  return (
    <group ref={groupRef} position={[1.9, 0.05, 0]} scale={[1.28, 1.28, 1.28]}>
      <primitive object={clonedScene} />
    </group>
  )
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ModelErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[WristbandModel] GLB failed, using torus fallback:", error.message)
    }
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

// ─── Model Selector ───────────────────────────────────────────────────────────

function ModelContent({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  const fallback = <FallbackTorus groupRef={groupRef} />
  if (!USE_GLB_MODEL) return fallback

  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <WristbandGLB groupRef={groupRef} />
      </Suspense>
    </ModelErrorBoundary>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────

/**
 * All Three.js scene content — must live inside <Canvas>.
 *
 * useFrame animation priority:
 *   1. Y rotation  — always runs (unless reducedMotion)
 *   2. Breathe     — sine wave, frame-rate independent via clock time
 *   3. Parallax    — desktop only, lerped toward normalised mouse position
 */
function SceneContent({
  groupRef,
  mouseRef,
  isMobile,
  reducedMotion,
}: {
  groupRef: React.RefObject<THREE.Group | null>
  mouseRef: React.MutableRefObject<Vec2>
  isMobile: boolean
  reducedMotion: boolean
}) {
  useFrame((state) => {
    if (!groupRef.current) return
    const g = groupRef.current
    const t = state.clock.getElapsedTime()

    // 1. Rotation
    if (!reducedMotion) g.rotation.y += ANIM.ROTATION_SPEED

    // 2. Breathe — frame-rate independent (clock, not delta accumulation)
    const breatheY = Math.sin(t * ANIM.BREATHE_FREQUENCY) * ANIM.BREATHE_AMPLITUDE

    // 3. Position — base X places ring to right so center text stays legible
    if (!isMobile && !reducedMotion) {
      const targetX = 1.9 + mouseRef.current.x * ANIM.MOUSE_X
      g.position.x += (targetX - g.position.x) * ANIM.LERP_MOUSE
      g.position.y += (breatheY - mouseRef.current.y * ANIM.MOUSE_Y - g.position.y) * ANIM.LERP_MOUSE
    } else {
      g.position.y += (breatheY - g.position.y) * ANIM.LERP_MOBILE
      g.position.x += (1.9 - g.position.x) * ANIM.LERP_MOBILE
    }
  })

  return (
    <>
      {/* Soft ambient — lifts shadows from pure black */}
      <ambientLight intensity={0.32} />

      {/* Key light — top right, slightly cool */}
      <directionalLight position={[5, 5, 5]} intensity={1.8} color="#f0f0ff" castShadow={false} />

      {/* Crimson fill — Suraksha brand accent, bottom left */}
      <directionalLight position={[-4, -3, -5]} intensity={0.6} color="#c0392b" />

      {/* Rim light — top back — creates edge separation against black background */}
      <directionalLight position={[0, 8, -6]} intensity={0.5} color="#ffffff" />

      {/* Front point — softens flatness, adds front-face depth */}
      <pointLight position={[0, 0.5, 3.5]} intensity={0.5} color="#ffffff" decay={2} />

      {/* Red point — hot spot on band, reinforces crimson theme */}
      <pointLight position={[-1, -1, 2]} intensity={0.4} color="#ff2222" decay={2} />

      {/* IBL — physically correct reflections on metallic surface */}
      <Environment preset="night" />

      <ModelContent groupRef={groupRef} />
    </>
  )
}

// ─── Root Export ──────────────────────────────────────────────────────────────

const WristbandModel = forwardRef<WristbandModelRef, object>(
  function WristbandModel(_, ref) {
    const groupRef        = useRef<THREE.Group>(null)
    const mouseRef        = useRef<Vec2>({ x: 0, y: 0 })
    const canvasWrapperRef = useRef<HTMLDivElement>(null)

    // Stable on mount — won't trigger re-renders
    const isMobile = useMemo(
      () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT, []
    )
    const reducedMotion = useMemo(
      () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []
    )

    // Expose Three.js group to parent for scroll-driven scale/opacity animations
    useImperativeHandle(ref, () => ({
      get group() { return groupRef.current },
    }))

    // Mouse tracking — passive listener, desktop only
    const handleMouseMove = useCallback((e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      }
    }, [])

    useEffect(() => {
      if (isMobile || reducedMotion) return
      window.addEventListener("mousemove", handleMouseMove, { passive: true })
      return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [isMobile, reducedMotion, handleMouseMove])

    // Entry animations
    useGSAP(() => {
      if (reducedMotion) return

      // 1. Fade in canvas wrapper
      if (canvasWrapperRef.current) {
        gsap.fromTo(
          canvasWrapperRef.current,
          { opacity: 0 },
          { opacity: 1, duration: ANIM.CANVAS_FADE_DUR, ease: "power2.out", delay: ANIM.CANVAS_FADE_DELAY }
        )
      }

      // 2. Scale in 3D group — polls until Three.js has populated the ref
      //    (groupRef is null until the Canvas/SceneContent first renders)
      const poll = setInterval(() => {
        if (!groupRef.current) return
        clearInterval(poll)

        gsap.fromTo(
          groupRef.current.scale,
          { x: ANIM.ENTRY_SCALE_FROM, y: ANIM.ENTRY_SCALE_FROM, z: ANIM.ENTRY_SCALE_FROM },
          {
            x: 1.28, y: 1.28, z: 1.28,
            duration: ANIM.ENTRY_DURATION,
            ease: "expo.out",   // expo.out = fast settle, premium feel
            delay: ANIM.ENTRY_DELAY,
          }
        )
      }, 50)

      return () => clearInterval(poll)
    }, [reducedMotion])

    return (
      <div
        ref={canvasWrapperRef}
        data-canvas-wrapper          // targeted by useHeroScroll scroll-fade
        aria-hidden="true"           // decorative — skip for screen readers
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,                // GSAP animates to 1
          background: "#000000",
        }}
      >
        {/* Show loader only when GLB mode is enabled */}
        {USE_GLB_MODEL ? <CanvasLoader /> : null}

        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "#000000" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 1)
          }}
          gl={{
            alpha: false,
            antialias: true,
            powerPreference: "high-performance",      // prefer dGPU on dual-GPU systems
            outputColorSpace: THREE.SRGBColorSpace,   // correct color on r150+
            toneMapping: THREE.ACESFilmicToneMapping, // cinematic tone — no blown-out whites
            toneMappingExposure: 0.88,                // slightly under-exposed = more moody on black bg
          }}
          dpr={[1, isMobile ? 1.5 : 2]}              // adaptive pixel ratio
          frameloop="always"
          resize={{ scroll: false, debounce: { scroll: 0, resize: 100 } }}
        >
          <SceneContent
            groupRef={groupRef}
            mouseRef={mouseRef}
            isMobile={isMobile}
            reducedMotion={reducedMotion}
          />
        </Canvas>
      </div>
    )
  }
)

// Uncomment when wristband.glb is placed in /public/models/
// Tells Next.js to prefetch during idle time for instant first render
// useGLTF.preload(WRISTBAND_GLB_PATH)

export default WristbandModel