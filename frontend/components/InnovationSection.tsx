"use client"

import { MapPin, Users, Camera } from "lucide-react"
import TextReveal from "@/components/TextReveal"
import Crosshairs from "@/components/Crosshairs"

const features = [
  {
    icon: MapPin,
    label: "Live GPS Tracking",
    delay: 0,
  },
  {
    icon: Users,
    label: "Family Alerts",
    delay: 100,
  },
  {
    icon: Camera,
    label: "Auto Evidence Capture",
    delay: 200,
  },
]

export default function InnovationSection() {
  return (
    <section id="innovation" className="relative py-24 lg:py-40 px-6 lg:px-10">
      <Crosshairs />
      <div className="mx-auto max-w-4xl text-center">
        <p className="section-label mb-6" data-aos="fade-up">
          Innovation
        </p>
        <TextReveal
          as="h2"
          className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-foreground text-balance leading-tight"
          staggerMs={90}
        >
          One Tap. Instant Alert.
        </TextReveal>
        <p
          className="mt-6 lg:mt-8 text-base lg:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          A single tap on the Suraksha band instantly sends your live GPS location 
          to your family and emergency contacts. No phone in hand required. 
          SOS stays active until YOU switch it off.
        </p>

        {/* Feature Pills */}
        <div className="mt-12 lg:mt-16 flex flex-wrap items-center justify-center gap-4 lg:gap-6">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="feature-pill flex items-center gap-3 px-6 py-3.5 border border-dark-border bg-secondary/50 text-foreground/80 text-sm tracking-wider uppercase cursor-default"
              data-aos="zoom-in"
              data-aos-delay={feature.delay}
            >
              <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative side lines */}
      <div className="absolute left-6 lg:left-10 top-1/2 -translate-y-1/2 w-px h-32 bg-gradient-to-b from-transparent via-primary/20 to-transparent hidden lg:block" />
      <div className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 w-px h-32 bg-gradient-to-b from-transparent via-primary/20 to-transparent hidden lg:block" />
    </section>
  )
}
