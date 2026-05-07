"use client"

import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { WristbandModelRef } from "@/components/hero/WristbandModel"
import { sections, type SectionIndicatorRefs } from "@/components/hero/SectionIndicator"

gsap.registerPlugin(ScrollTrigger)

interface UseHeroScrollProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  wristbandRef: React.RefObject<WristbandModelRef | null>
  sectionIndicatorRef: React.RefObject<SectionIndicatorRefs | null>
  canvasWrapperRef: React.RefObject<HTMLDivElement | null>
  onSectionChange: (index: number) => void
}

export function useHeroScroll({
  scrollContainerRef,
  wristbandRef,
  sectionIndicatorRef,
  canvasWrapperRef,
  onSectionChange,
}: UseHeroScrollProps) {
  const activeIndexRef = useRef(0)

  const transitionToSection = (index: number) => {
    if (activeIndexRef.current === index) return
    activeIndexRef.current = index
    onSectionChange(index)

    const refs = sectionIndicatorRef?.current
    if (!refs?.sectionRefs) return

    refs.sectionRefs.forEach((sectionRef, i) => {
      const el = sectionRef?.current
      if (!el) return
      const targets = el.querySelectorAll("[data-section-number], [data-section-label]")
      if (targets.length === 0) return
      gsap.to(targets, {
        color: i === index ? "#ffffff" : "#333333",
        opacity: i === index ? 1 : 0.5,
        duration: 0.3,
        ease: "power2.out",
      })
    })
  }

  useGSAP(
    () => {
      if (typeof window === "undefined") return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      if (!scrollContainerRef || !scrollContainerRef.current) return

      const container = scrollContainerRef.current

      sections.forEach((_, i) => {
        ScrollTrigger.create({
          trigger: container,
          start: `${i * 20}% top`,
          end: `${(i + 1) * 20}% top`,
          scrub: 1,
          onEnter: () => transitionToSection(i),
          onEnterBack: () => transitionToSection(i),
        })
      })

      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "100vh top",
        scrub: 1,
        onUpdate: (self) => {
          const group = wristbandRef?.current?.group
          if (group) {
            group.rotation.y += self.getVelocity() * 0.0001
            const s = 1.4 - self.progress * 0.8
            group.scale.set(s, s, s)
          }
          if (canvasWrapperRef?.current) {
            gsap.set(canvasWrapperRef.current, {
              opacity: Math.max(0, 1 - self.progress * 1.25),
            })
          }
        },
      })

      gsap.to("[data-hero-line]", {
        y: -80,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "30% top",
          scrub: 1,
        },
      })

      gsap.to("[data-hero-eyebrow]", {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "20% top",
          scrub: 1,
        },
      })

      const refresh = () => ScrollTrigger.refresh()
      if (document.readyState === "complete") {
        setTimeout(refresh, 100)
      } else {
        window.addEventListener("load", () => setTimeout(refresh, 100))
      }

      return () => {
        ScrollTrigger.getAll().forEach((t) => t.kill())
      }
    },
    {
      ...(scrollContainerRef && { scope: scrollContainerRef }),
      dependencies: [],
    }
  )
}
