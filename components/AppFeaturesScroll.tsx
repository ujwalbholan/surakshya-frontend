"use client"

import { useRef, useEffect, useState } from "react"
import { Shield, MapPin, Route, Camera, Bell } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "One Tap SOS",
    description:
      "A single press sends your live GPS location to family and emergency contacts instantly. No phone in hand required.",
    stat: "< 2s",
    statLabel: "Alert Time",
  },
  {
    icon: MapPin,
    title: "Live GPS Tracking",
    description:
      "Real-time location sharing with trusted contacts. Your family always knows where you are, even without calling.",
    stat: "24/7",
    statLabel: "Active",
  },
  {
    icon: Route,
    title: "Safe Walk Mode",
    description:
      "Continuously monitors your route. If you stop unexpectedly or deviate from your path, alerts are sent automatically.",
    stat: "10m",
    statLabel: "Accuracy",
  },
  {
    icon: Camera,
    title: "Evidence Capture",
    description:
      "Auto-captures audio and location data when SOS triggers. Encrypted evidence securely stored and shareable with authorities.",
    stat: "AES-256",
    statLabel: "Encryption",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description:
      "Geofencing, low battery warnings, and abnormal activity detection. The band thinks ahead so you don't have to.",
    stat: "5+",
    statLabel: "Alert Types",
  },
]

export default function AppFeaturesScroll() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const sectionTop = rect.top
      const sectionHeight = rect.height - window.innerHeight
      if (sectionHeight <= 0) return
      const raw = -sectionTop / sectionHeight
      setProgress(Math.max(0, Math.min(1, raw)))
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const cardCount = features.length
  const translatePercent = progress * (cardCount - 1) * -100 / cardCount

  return (
    <div
      ref={sectionRef}
      className="relative"
      style={{ height: `${80 + cardCount * 45}vh` }}
    >
      <div
        className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden transition-opacity duration-500"
        style={{ opacity: progress > 0.95 ? Math.max(0, 1 - (progress - 0.95) * 20) : 1 }}
      >
        {/* Header */}
        <div className="px-6 lg:px-10 mb-6 lg:mb-10">
          <div className="mx-auto max-w-7xl">
            <p className="section-label mb-3">The App</p>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance">
                Five Pillars of Safety
              </h2>
              <div className="hidden sm:flex items-center gap-3">
                <div className="h-px w-16 bg-muted-foreground/30" />
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground whitespace-nowrap">
                  Scroll to explore
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 lg:px-10 mb-5">
          <div className="mx-auto max-w-7xl">
            <div className="h-px bg-border relative">
              <div
                className="absolute top-0 left-0 h-full bg-primary"
                style={{
                  width: `${progress * 100}%`,
                  transition: "width 0.05s linear",
                }}
              />
            </div>
          </div>
        </div>

        {/* Horizontal sliding track */}
        <div className="relative overflow-hidden px-6 lg:px-10">
          <div
            className="flex gap-6 lg:gap-8 will-change-transform"
            style={{
              transform: `translateX(${translatePercent}%)`,
              transition: "transform 0.05s linear",
            }}
          >
            {features.map((feature, index) => {
              // Calculate per-card visibility (0 to 1) based on which card is "active"
              const cardProgress = progress * (cardCount - 1)
              const dist = Math.abs(cardProgress - index)
              const isActive = dist < 0.6

              return (
                <div
                  key={feature.title}
                  className="flex-shrink-0 w-[82vw] sm:w-[55vw] lg:w-[380px] xl:w-[420px]"
                >
                  <div
                    className="h-full border bg-card p-6 lg:p-8 flex flex-col justify-between transition-all duration-300"
                    style={{
                      borderColor: isActive
                        ? "rgba(192, 57, 43, 0.4)"
                        : "var(--border)",
                      opacity: isActive ? 1 : 0.5,
                      transform: isActive ? "scale(1)" : "scale(0.97)",
                    }}
                  >
                    {/* Top */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <feature.icon
                          className="w-6 h-6 transition-colors duration-300"
                          style={{
                            color: isActive ? "#C0392B" : "#888888",
                          }}
                        />
                        <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-4 tracking-tight">
                        {feature.title}
                      </h3>

                      <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Bottom stat */}
                    <div className="mt-8 pt-6 border-t border-border flex items-end justify-between">
                      <div>
                        <p className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                          {feature.stat}
                        </p>
                        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">
                          {feature.statLabel}
                        </p>
                      </div>
                      <div
                        className="w-8 h-8 border flex items-center justify-center transition-colors duration-300"
                        style={{
                          borderColor: isActive ? "#C0392B" : "var(--border)",
                          color: isActive ? "#C0392B" : "#888888",
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 6H11M11 6L6 1M11 6L6 11"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom dot indicators */}
        <div className="px-6 lg:px-10 mt-6 lg:mt-8">
          <div className="mx-auto max-w-7xl flex items-center gap-3">
            {features.map((_, i) => {
              const cardProgress = progress * (cardCount - 1)
              const isActive = Math.abs(cardProgress - i) < 0.6
              return (
                <div
                  key={i}
                  className="h-1 transition-all duration-300"
                  style={{
                    width: isActive ? "2rem" : "0.5rem",
                    backgroundColor: isActive ? "#C0392B" : "var(--border)",
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
