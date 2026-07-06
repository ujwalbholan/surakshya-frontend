"use client"

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
  return (
    <section className="relative py-20 lg:py-24">
      <div className="flex flex-col overflow-hidden">
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
                  Explore features
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal card track */}
        <div className="app-features-scrollbar relative overflow-x-auto px-6 lg:px-10 pb-3">
          <div
            className="flex gap-6 lg:gap-8"
          >
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="flex-shrink-0 w-[82vw] sm:w-[55vw] lg:w-[380px] xl:w-[420px]"
              >
                <div
                  className="h-full border bg-card p-6 lg:p-8 flex flex-col justify-between transition-all duration-300"
                  style={{
                    borderColor: "rgba(192, 57, 43, 0.35)",
                  }}
                >
                    {/* Top */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <feature.icon
                          className="w-6 h-6 transition-colors duration-300"
                          style={{
                            color: "#C0392B",
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
                          borderColor: "#C0392B",
                          color: "#C0392B",
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
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .app-features-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(192, 57, 43, 0.7) rgba(255, 255, 255, 0.08);
        }

        .app-features-scrollbar::-webkit-scrollbar {
          height: 6px;
        }

        .app-features-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
        }

        .app-features-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, rgba(192, 57, 43, 0.9), rgba(255, 80, 80, 0.9));
          border-radius: 999px;
        }

        .app-features-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, rgba(220, 70, 70, 0.95), rgba(255, 110, 110, 0.95));
        }
      `}</style>
    </section>
  )
}
