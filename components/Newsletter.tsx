"use client"

import { useState } from "react"
import Image from "next/image"
import Crosshairs from "@/components/Crosshairs"

export default function Newsletter() {
  const [email, setEmail] = useState("")
  const [agreed, setAgreed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !agreed) return
    setEmail("")
    setAgreed(false)
  }

  return (
    <section id="newsletter" className="relative py-16 lg:py-24 px-6 lg:px-10">
      {/* Outer crosshairs */}
      <Crosshairs />

      {/* Rounded image card container - like lightweight.info subscribe */}
      <div className="relative mx-auto max-w-7xl rounded-2xl overflow-hidden min-h-[500px] lg:min-h-[550px] flex items-center justify-center">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/social-1.jpg"
            alt="Woman walking safely at night"
            fill
            className="object-cover"
            sizes="100vw"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#0A0A0A]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 via-transparent to-[#0A0A0A]/30" />
        </div>

        {/* Inner crosshairs */}
        <div className="absolute top-8 left-8 text-[#FAFAFA]/30 text-2xl font-light select-none">+</div>
        <div className="absolute top-8 right-8 text-[#FAFAFA]/30 text-2xl font-light select-none">+</div>
        <div className="absolute bottom-8 left-8 text-[#FAFAFA]/30 text-2xl font-light select-none">+</div>
        <div className="absolute bottom-8 right-8 text-[#FAFAFA]/30 text-2xl font-light select-none">+</div>

        {/* Decorative arc lines */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
            <ellipse cx="50" cy="50" rx="45" ry="45" stroke="rgba(250,250,250,0.06)" strokeWidth="0.15" />
            <ellipse cx="50" cy="50" rx="35" ry="35" stroke="rgba(250,250,250,0.04)" strokeWidth="0.1" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 py-16 max-w-2xl mx-auto">
          <h3
            className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#FAFAFA] uppercase mb-3"
            data-aos="fade-up"
          >
            Subscribe to
            <br />
            our newsletter
          </h3>

          <p
            className="text-sm sm:text-base text-[#FAFAFA]/80 mb-10"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Stay informed with the latest from Suraksha.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            {/* Glassmorphism pill input + white pill button */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email*"
                  required
                  className="w-full px-6 py-4 bg-[#0A0A0A]/30 backdrop-blur-md border border-[#FAFAFA]/15 text-[#FAFAFA] text-sm rounded-full placeholder:text-[#FAFAFA]/50 focus:outline-none focus:border-[#FAFAFA]/40 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-[#FAFAFA] text-[#0A0A0A] text-sm font-medium tracking-[0.12em] uppercase rounded-full transition-all duration-300 hover:bg-[#FAFAFA]/90 hover:scale-105 shrink-0"
              >
                Sign Up
              </button>
            </div>

            {/* Privacy checkbox */}
            <label className="flex items-start gap-3 text-left cursor-pointer group px-2">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded-sm border-[#FAFAFA]/30 bg-transparent accent-[#FAFAFA] cursor-pointer shrink-0"
              />
              <span className="text-xs text-[#FAFAFA]/70 leading-relaxed group-hover:text-[#FAFAFA]/90 transition-colors">
                I agree to the collection and processing of my personal data as described in the{" "}
                <a href="#" className="underline underline-offset-2 hover:text-[#FAFAFA]">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
          </form>
        </div>
      </div>
    </section>
  )
}
