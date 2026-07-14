"use client"

import { useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const FROM_BY_VARIANT: Record<string, gsap.TweenVars> = {
  "fade-up": { y: 32, opacity: 0 },
  "fade-down": { y: -32, opacity: 0 },
  "fade-left": { x: 40, opacity: 0 },
  "fade-right": { x: -40, opacity: 0 },
  "zoom-in": { scale: 0.92, opacity: 0 },
}

export function useScrollReveal(root?: HTMLElement | null) {
  useEffect(() => {
    const scope = root ?? document.body
    const elements = scope.querySelectorAll<HTMLElement>("[data-reveal]")
    if (elements.length === 0) return

    const ctx = gsap.context(() => {
      elements.forEach((el) => {
        const variant = el.dataset.reveal || "fade-up"
        const delayMs = Number(el.dataset.revealDelay || 0)
        const durationMs = Number(el.dataset.revealDuration || 800)
        const from = FROM_BY_VARIANT[variant] ?? FROM_BY_VARIANT["fade-up"]

        gsap.from(el, {
          ...from,
          duration: durationMs / 1000,
          delay: delayMs / 1000,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        })
      })
    }, scope)

    ScrollTrigger.refresh()

    return () => ctx.revert()
  }, [root])
}
