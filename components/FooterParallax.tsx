"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

export default function FooterParallax() {
  const sectionRef = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const viewH = window.innerHeight
      // Calculate how far through viewport the section is
      const progress = 1 - (rect.top + rect.height) / (viewH + rect.height)
      setOffset(progress)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Stronger parallax shift: image moves up to 30% of its height
  const translateY = (offset - 0.5) * -30

  return (
    <section ref={sectionRef} className="relative h-[60vh] lg:h-[70vh] overflow-hidden">
      {/* Parallax image - CSS transform for smooth strong parallax (desktop) */}
      <div
        className="absolute inset-0 hidden lg:block"
        style={{
          transform: `translateY(${translateY}%) scale(1.3)`,
          transition: "transform 0.1s linear",
          backgroundImage: `url('/images/footer-parallax.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Mobile fallback with milder parallax */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{
          transform: `translateY(${translateY * 0.5}%) scale(1.15)`,
          transition: "transform 0.1s linear",
        }}
      >
        <Image
          src="/images/footer-parallax.jpg"
          alt="Two women walking confidently at night"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Heavy dark gradient overlay - top */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-transparent" />

      {/* Heavy dark gradient overlay - bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

      {/* Side vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />

      {/* Overall dark tint */}
      <div className="absolute inset-0 bg-background/40" />

      {/* Centered statement text */}
      <div className="absolute inset-0 flex items-center justify-center z-10 px-6">
        <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-light tracking-wide text-foreground/90 text-center max-w-2xl leading-relaxed text-balance">
          Every woman deserves to walk without fear.
        </p>
      </div>
    </section>
  )
}
