"use client"

import Image from "next/image"
import TextReveal from "@/components/TextReveal"
import Crosshairs from "@/components/Crosshairs"

const testimonials = [
  {
    image: "/images/social-1.jpg",
    quote: "I walk home from work at night now and I finally feel safe. My mom gets my location instantly — it changed everything.",
    name: "Priya M.",
    delay: 0,
  },
  {
    image: "/images/social-2.jpg",
    quote: "It looks like a bracelet, but it's my safety net. My family can track me on late-night commutes. Peace of mind is priceless.",
    name: "Ananya R.",
    delay: 100,
  },
  {
    image: "/images/social-3.jpg",
    quote: "We both wear Suraksha now. Knowing we can alert each other in one tap — it's the kind of tech that actually matters.",
    name: "Meera & Sana",
    delay: 200,
  },
]

export default function SocialWall() {
  return (
    <section className="relative py-24 lg:py-40 px-6 lg:px-10">
      <Crosshairs />
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-20" data-reveal="fade-up">
          <p className="section-label mb-4">#StayWithSuraksha</p>
          <TextReveal
            as="h2"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance"
            staggerMs={80}
          >
            Real stories. Real safety.
          </TextReveal>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="group relative bg-card border border-dark-border overflow-hidden transition-all duration-500 hover:border-primary/30"
              data-reveal="fade-up"
              data-reveal-delay={item.delay}
            >
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={item.image}
                  alt={`${item.name} — Suraksha user`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
              </div>

              {/* Text */}
              <div className="relative px-6 pb-6 -mt-20">
                <p className="text-sm italic text-foreground/80 leading-relaxed mb-4">
                  {`"${item.quote}"`}
                </p>
                <p className="text-xs tracking-[0.15em] uppercase text-primary font-medium">
                  {item.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
