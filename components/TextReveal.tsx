"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

interface TextRevealProps {
  children: string
  as?: "h1" | "h2" | "h3" | "p"
  className?: string
  staggerMs?: number
  threshold?: number
}

export default function TextReveal({
  children,
  as: Tag = "h2",
  className = "",
  staggerMs = 80,
  threshold = 0.2,
}: TextRevealProps) {
  const containerRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        } else {
          // Allow re-trigger when scrolling back
          setIsVisible(false)
        }
      },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  const words = children.split(/\s+/)

  return (
    <Tag ref={containerRef as React.RefObject<never>} className={className}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block overflow-hidden mr-[0.3em] last:mr-0"
        >
          <span
            className="inline-block transition-all will-change-transform"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(100%)",
              transitionProperty: "opacity, transform",
              transitionDuration: "0.6s",
              transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              transitionDelay: isVisible ? `${index * staggerMs}ms` : "0ms",
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </Tag>
  )
}
