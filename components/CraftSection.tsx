"use client"

import Image from "next/image"
import TextReveal from "@/components/TextReveal"
import Crosshairs from "@/components/Crosshairs"

export default function CraftSection() {
  return (
    <section id="craft" className="relative py-24 lg:py-40 px-6 lg:px-10 overflow-hidden">
      <Crosshairs />
      {/* Parallax background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url('/images/craft.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Text */}
          <div className="flex flex-col gap-6 lg:gap-8 order-2 lg:order-1">
            <p className="section-label" data-aos="fade-up">
              Craft
            </p>
            <TextReveal
              as="h2"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance leading-tight"
              staggerMs={80}
            >
              Handmade Technology
            </TextReveal>
            <p
              className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-lg"
              data-aos="fade-left"
              data-aos-delay="200"
            >
              Built with aerospace-grade materials and Bluetooth 5.0 BLE, our band 
              communicates instantly with your phone. Lightweight, waterproof (IPX4), 
              and designed to wear all day — it looks like jewellery, works like a lifeline.
            </p>
            <div
              className="h-px w-16 bg-primary mt-2"
              data-aos="fade-up"
              data-aos-delay="300"
            />
          </div>

          {/* Right - Image */}
          <div
            className="relative aspect-[4/5] overflow-hidden order-1 lg:order-2"
            data-aos="fade-right"
            data-aos-duration="1000"
          >
            <Image
              src="/images/craft.jpg"
              alt="Internal components of the Suraksha IoT safety band"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
