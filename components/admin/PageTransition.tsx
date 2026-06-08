"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export default function PageTransition({ children, className }: PageTransitionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    )
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
