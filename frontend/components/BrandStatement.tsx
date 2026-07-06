"use client"

import Image from "next/image"
import TextReveal from "@/components/TextReveal"
import Crosshairs from "@/components/Crosshairs"

export default function BrandStatement() {
  return (
    <section id="brand" className="relative h-screen flex items-center overflow-hidden">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/footer-parallax.jpg"
          alt="Women walking confidently"
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
        {/* Dark overlay like lightweight.info */}
        <div className="absolute inset-0 bg-[#0A0A0A]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-transparent to-[#0A0A0A]/40" />
      </div>

      {/* Crosshair decorators */}
      <Crosshairs />

      {/* Content - left-aligned like lightweight.info */}
      <div className="relative z-10 px-10 lg:px-20 xl:px-32 max-w-5xl">
        {/* Italic brand name */}
        <p
          className="text-2xl sm:text-3xl lg:text-4xl italic font-light text-[#FAFAFA]/90 mb-8"
          data-aos="fade-up"
        >
          Suraksha
        </p>

        {/* Big bold uppercase heading */}
        <TextReveal
          as="h2"
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.5rem] font-bold tracking-tight text-[#FAFAFA] leading-[1.15] uppercase"
          staggerMs={50}
        >
          At Suraksha, we craft more than a band. We shape icons of protection.
        </TextReveal>

        {/* White rounded pill button */}
        <div className="mt-12" data-aos="fade-up" data-aos-delay="400">
          <a
            href="#philosophy"
            className="inline-flex items-center justify-center px-10 py-4 bg-[#FAFAFA] text-[#0A0A0A] text-sm font-medium tracking-[0.15em] uppercase rounded-full transition-all duration-300 hover:bg-[#FAFAFA]/90 hover:scale-105"
          >
            About Us
          </a>
        </div>
      </div>
    </section>
  )
}
