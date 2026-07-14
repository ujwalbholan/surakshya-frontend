"use client"

import Image from "next/image"
import TextReveal from "@/components/TextReveal"
import Crosshairs from "@/components/Crosshairs"

export default function PhilosophySection() {
  return (
    <section id="philosophy" className="relative py-24 lg:py-40 px-6 lg:px-10">
      <Crosshairs />
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Image */}
          <div
            className="relative aspect-[4/5] overflow-hidden"
            data-reveal="fade-right"
            data-reveal-duration="1000"
          >
            <Image
              src="/images/philosophy.jpg"
              alt="Woman wearing Suraksha safety band on wrist"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Subtle red overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>

          {/* Right - Text */}
          <div className="flex flex-col gap-6 lg:gap-8">
            <p className="section-label" data-reveal="fade-up">
              Philosophy
            </p>
            <TextReveal
              as="h2"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance leading-tight"
              staggerMs={80}
            >
              Safety Engineered
            </TextReveal>
            <p
              className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-lg"
              data-reveal="fade-up"
              data-reveal-delay="200"
            >
              Every detail of Suraksha is built around one purpose — keeping women safe. 
              From the IoT band to the live GPS tracking, every component is engineered with 
              precision, speed, and trust.
            </p>
            <div
              className="h-px w-16 bg-primary mt-2"
              data-reveal="fade-up"
              data-reveal-delay="300"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
