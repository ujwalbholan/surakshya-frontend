"use client"

/**
 * Surakshya Band for ProductShowcase — ports the Flutter splash wristband.
 *
 * Source of truth (surakshya-app):
 *   - splash_wristband_painter.dart  → geometry + glossy burgundy material
 *   - splash_wristband.dart          → idle spin / tumble / float periods
 *
 * Motions (looping, same periods as Flutter):
 *   spin   8s  → rotationY full turn, rotationZ × 0.35
 *   tumble 12s → rotationX full turn (on top of base tilt)
 *   float  2.8s → vertical sine ±9% of major radius
 */

import { useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

// ─── Flutter constants ────────────────────────────────────────────────────────

const MAJOR_RADIUS = 1.15
const TUBE_RADIUS = 0.2
/** Near-horizontal pose with a slight pitch toward the camera. */
const BASE_TILT = Math.PI * 0.5 - 0.3

const IDLE = {
  SPIN_PERIOD: 8,
  TUMBLE_PERIOD: 12,
  FLOAT_PERIOD: 2.8,
  FLOAT_AMP: MAJOR_RADIUS * 0.09,
  SPIN_Z_FACTOR: 0.35,
} as const

const MAT = {
  color: "#B52A40",
  metalness: 0.78,
  roughness: 0.04,
  emissive: "#3D0814",
  emissiveIntensity: 0.04,
} as const

// ─── Band mesh ────────────────────────────────────────────────────────────────

function FlutterWristband({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null)

  const geo = useMemo(
    () => new THREE.TorusGeometry(MAJOR_RADIUS, TUBE_RADIUS, 48, 160),
    []
  )

  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: MAT.color,
        metalness: MAT.metalness,
        roughness: MAT.roughness,
        emissive: MAT.emissive,
        emissiveIntensity: MAT.emissiveIntensity,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        sheen: 0.15,
        sheenColor: new THREE.Color("#6B1020"),
      }),
    []
  )

  useEffect(() => {
    return () => {
      geo.dispose()
      mat.dispose()
    }
  }, [geo, mat])

  useFrame((state) => {
    const g = groupRef.current
    if (!g) return

    if (reducedMotion) {
      g.rotation.set(BASE_TILT, 0, 0)
      g.position.y = 0
      return
    }

    const t = state.clock.getElapsedTime()
    const spin = (t / IDLE.SPIN_PERIOD) * Math.PI * 2
    const tumble = (t / IDLE.TUMBLE_PERIOD) * Math.PI * 2
    const float = Math.sin((t / IDLE.FLOAT_PERIOD) * Math.PI * 2) * IDLE.FLOAT_AMP

    // Match Flutter transform order conceptually: Z → Y → (tilt + X)
    g.rotation.z = spin * IDLE.SPIN_Z_FACTOR
    g.rotation.y = spin
    g.rotation.x = BASE_TILT + tumble
    g.position.y = float
  })

  return (
    <group ref={groupRef} scale={1.15}>
      <mesh geometry={geo} material={mat} />
    </group>
  )
}

// ─── Lighting (Flutter key / fill / rim directions) ───────────────────────────

function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={0.28} />
      {/* Key — (4, 6, 5), intensity ~2.8 */}
      <directionalLight position={[4, 6, 5]} intensity={2.4} color="#ffffff" />
      {/* Fill — burgundy (−3, −2, −4) */}
      <directionalLight position={[-3, -2, -4]} intensity={0.55} color="#6B1020" />
      {/* Rim — soft pink-white (0, 5, −6) */}
      <directionalLight position={[0, 5, -6]} intensity={0.55} color="#FFE8E8" />
      <pointLight position={[0, 0.4, 3.2]} intensity={0.35} color="#ffffff" decay={2} />

      <FlutterWristband reducedMotion={reducedMotion} />
    </>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ShowcaseWristband() {
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  )

  return (
    <div className="relative h-full w-full band-glow" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42 }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95,
        }}
        dpr={[1, 2]}
        frameloop={reducedMotion ? "demand" : "always"}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
      >
        <Scene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
