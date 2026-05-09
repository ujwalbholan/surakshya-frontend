"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { useFloating, offset, flip, shift, useHover, useInteractions, useDismiss, FloatingPortal } from "@floating-ui/react"
import Crosshairs from "@/components/Crosshairs"

const tabs = [
  {
    id: "sos",
    label: "One Tap SOS",
    description: "A single tap triggers an instant SOS alert. Your GPS coordinates are sent to emergency contacts in real-time. No phone needed.",
  },
  {
    id: "tracking",
    label: "Live Tracking",
    description: "Real-time GPS tracking lets your family know exactly where you are. Share your live route with trusted contacts during commutes.",
  },
  {
    id: "safewalk",
    label: "Safe Walk",
    description: "Activate Safe Walk mode and your path is monitored continuously. If you deviate or stop unexpectedly, alerts are sent automatically.",
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Automatically captures audio and location data when SOS is triggered. Secure, encrypted evidence that can be shared with authorities.",
  },
]

/* Left sidebar section indicators like lightweight.info */
const sidebarSections = [
  { num: "01", label: "PHILOSOPHY" },
  { num: "02", label: "CRAFT" },
  { num: "03", label: "INNOVATION" },
]

function TabTooltip({ tab }: { tab: typeof tabs[0] }) {
  const [isOpen, setIsOpen] = useState(false)
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(12), flip(), shift()],
    placement: "top",
  })

  const hover = useHover(context, { move: false, delay: { open: 100, close: 100 } })
  const dismiss = useDismiss(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, dismiss])

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className={`px-4 py-3 lg:px-6 lg:py-4 text-xs lg:text-sm tracking-[0.15em] uppercase transition-all duration-300 border-b-2 ${
          isOpen
            ? "border-crimson text-[#FAFAFA]"
            : "border-transparent text-[#888888] hover:text-[#FAFAFA]"
        }`}
      >
        {tab.label}
      </button>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 max-w-xs px-5 py-4 border border-[#222222] bg-[#111111]/95 backdrop-blur-md shadow-2xl"
          >
            <p className="text-sm text-[#FAFAFA]/80 leading-relaxed">
              {tab.description}
            </p>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}

export default function ProductShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollRef = useRef(0)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x040406, 6, 12)
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
    camera.position.set(0, 0.2, 5.8)

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const product = new THREE.Group()
    scene.add(product)

    // Main bracelet body
    const bandGeo = new THREE.TorusGeometry(1.38, 0.17, 56, 180)
    const bandMat = new THREE.MeshPhysicalMaterial({
      color: 0xc0392b,
      metalness: 0.95,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
      sheen: 0.2,
      sheenColor: new THREE.Color(0x332a2c),
      emissive: 0x3a0b12,
      emissiveIntensity: 0.12,
    })
    const band = new THREE.Mesh(bandGeo, bandMat)
    band.rotation.x = Math.PI * 0.4
    product.add(band)

    // Core glow line
    const glowGeo = new THREE.TorusGeometry(1.38, 0.02, 16, 128)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xc0392b,
      transparent: true,
      opacity: 0.34,
    })
    const glowRing = new THREE.Mesh(glowGeo, glowMat)
    glowRing.rotation.x = Math.PI * 0.4
    product.add(glowRing)

    // Halo ring
    const ring2Geo = new THREE.TorusGeometry(1.56, 0.008, 16, 128)
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xc0392b,
      transparent: true,
      opacity: 0.16,
    })
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat)
    ring2.rotation.x = Math.PI * 0.4
    product.add(ring2)

    // Watch face module
    const moduleGeo = new THREE.CylinderGeometry(0.57, 0.57, 0.22, 48)
    const moduleMat = new THREE.MeshPhysicalMaterial({
      color: 0x1f1f23,
      metalness: 0.86,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    })
    const moduleMesh = new THREE.Mesh(moduleGeo, moduleMat)
    moduleMesh.rotation.z = Math.PI / 2
    moduleMesh.rotation.x = Math.PI * 0.4
    product.add(moduleMesh)

    // Glass top
    const glassGeo = new THREE.CircleGeometry(0.5, 48)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x162238,
      transmission: 0.52,
      thickness: 0.22,
      ior: 1.45,
      metalness: 0,
      roughness: 0.02,
      transparent: true,
      opacity: 0.9,
    })
    const glass = new THREE.Mesh(glassGeo, glassMat)
    glass.position.set(0.06, 0.18, 0)
    glass.rotation.x = Math.PI * 0.4 + Math.PI / 2
    product.add(glass)

    // Accent LED
    const ledGeo = new THREE.SphereGeometry(0.03, 20, 20)
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xff365e,
      emissive: 0xff365e,
      emissiveIntensity: 2.5,
      toneMapped: false,
    })
    const led = new THREE.Mesh(ledGeo, ledMat)
    led.position.set(-0.2, 0.22, -0.28)
    product.add(led)

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.22)
    scene.add(ambient)

    const key = new THREE.SpotLight(0xfff1e8, 2.6, 16, 0.45, 0.6)
    key.position.set(3.5, 4.2, 4.5)
    scene.add(key)

    const fill = new THREE.PointLight(0xc0392b, 1.8, 10)
    fill.position.set(-3.4, -1.5, 2.8)
    scene.add(fill)

    const rim = new THREE.PointLight(0xff6a8e, 1.1, 12)
    rim.position.set(0, 3.8, -2.2)
    scene.add(rim)

    const ice = new THREE.PointLight(0x80c8ff, 0.6, 10)
    ice.position.set(0.8, -1.8, 3.6)
    scene.add(ice)

    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const sectionMiddle = rect.top + rect.height / 2
      const viewportMiddle = window.innerHeight / 2
      scrollRef.current = (viewportMiddle - sectionMiddle) / window.innerHeight
    }
    window.addEventListener("scroll", handleScroll, { passive: true })

    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)

      const scroll = scrollRef.current
      const speed = 0.003 + Math.abs(scroll) * 0.012
      const pulse = (Math.sin(performance.now() * 0.0018) + 1) * 0.5

      product.rotation.y += speed
      product.rotation.x = Math.PI * 0.4 + scroll * 0.18
      glowRing.rotation.y += speed * 1.06
      ring2.rotation.y += speed * 0.92

      const zoomScale = 1 + Math.max(0, scroll) * 0.22
      product.scale.set(zoomScale, zoomScale, zoomScale)

      bandMat.emissiveIntensity = 0.1 + Math.max(0, scroll) * 0.22
      glowMat.opacity = 0.28 + Math.max(0, scroll) * 0.22 + pulse * 0.08
      ring2Mat.opacity = 0.12 + Math.max(0, scroll) * 0.1 + pulse * 0.04
      ledMat.emissiveIntensity = 1.8 + pulse * 1.6

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
      renderer.dispose()
      bandGeo.dispose()
      bandMat.dispose()
      glowGeo.dispose()
      glowMat.dispose()
      ring2Geo.dispose()
      ring2Mat.dispose()
      moduleGeo.dispose()
      moduleMat.dispose()
      glassGeo.dispose()
      glassMat.dispose()
      ledGeo.dispose()
      ledMat.dispose()
    }
  }, [])

  return (
    <section id="product" ref={sectionRef} className="relative py-24 lg:py-40 px-6 lg:px-10">
      <Crosshairs />

      {/* Left sidebar section indicators like lightweight.info */}
      <div className="hidden lg:flex flex-col gap-6 absolute left-8 top-8 z-10">
        {sidebarSections.map((sec) => (
          <div key={sec.num} className="flex flex-col">
            <span className="text-xs text-[#888888] font-light">{sec.num}</span>
            <span className="text-xs font-bold tracking-[0.15em] text-[#FAFAFA]">{sec.label}</span>
          </div>
        ))}
      </div>

      {/* Center vertical crosshair line */}
      <div className="hidden lg:block absolute left-1/2 top-10 bottom-10 w-px bg-[#FAFAFA]/5" />

      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: 3D Canvas */}
          <div className="relative w-full aspect-square max-w-lg mx-auto lg:mx-0" data-aos="fade-right">
            <canvas
              ref={canvasRef}
              className="w-full h-full band-glow"
            />
          </div>

          {/* Right: Content */}
          <div className="flex flex-col" data-aos="fade-left">
            <p className="section-label mb-4">Evolution</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-[#FAFAFA] uppercase mb-6">
              Suraksha Band
            </h2>
            <p className="text-base lg:text-lg text-[#888888] leading-relaxed mb-8 max-w-md">
              The all-new Suraksha Band continues our legacy with a completely re-engineered safety wearable built for instant alerts, precision GPS tracking, and seamless connectivity. First to feature dual-mode SOS technology, it handles emergencies with unmatched reliability.
            </p>

            {/* White rounded pill button */}
            <div>
              <a
                href="#innovation"
                className="inline-flex items-center justify-center px-10 py-4 bg-[#FAFAFA] text-[#0A0A0A] text-sm font-medium tracking-[0.12em] uppercase rounded-full transition-all duration-300 hover:bg-[#FAFAFA]/90 hover:scale-105"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Feature Tabs */}
        <div
          className="mt-12 lg:mt-16 flex flex-wrap items-center justify-center gap-1 border-b border-[#222222]"
          data-aos="fade-up"
          data-aos-delay="400"
        >
          {tabs.map((tab) => (
            <TabTooltip key={tab.id} tab={tab} />
          ))}
        </div>
      </div>
    </section>
  )
}
