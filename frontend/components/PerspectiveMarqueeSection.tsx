"use client"

import * as React from "react"

const ITEMS = [
  "Surakshya",
  "Safety",
  "Tracking",
  "Alerts",
  "SOS",
  "Protection",
  "Support",
  "Confidence",
]

function usePrefersDark() {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const update = () => setIsDark(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return isDark
}

function MarqueeTrack({
  items,
  color,
  fontSize,
}: {
  items: string[]
  color: string
  fontSize: number
}) {
  const pad = fontSize * 0.9

  return (
    <div className="perspective-marquee-track" aria-hidden>
      {items.map((item) => (
        <span
          key={item}
          className="perspective-marquee-item"
          style={{
            color,
            fontSize,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            paddingRight: pad,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

export default function PerspectiveMarqueeSection() {
  const isDark = usePrefersDark()
  const bg = isDark ? "#050505" : "#fafafa"
  const fade = isDark ? "#050505" : "#fafafa"
  const color = isDark ? "#fafafa" : "#171717"

  return (
    <section id="partners-marquee" className="relative border-y border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-5">
        <p className="section-label text-center">Trusted Technology Stack</p>
      </div>
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: "50vh",
          minHeight: 320,
          maxHeight: 520,
          background: bg,
          perspective: "1200px",
        }}
      >
        <div
          className="flex h-full w-full items-center justify-start"
          style={{
            transform: "rotateX(8deg) rotateY(-28deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="perspective-marquee-rail">
            <MarqueeTrack items={ITEMS} color={color} fontSize={80} />
            <MarqueeTrack items={ITEMS} color={color} fontSize={80} />
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${fade} 0%, transparent 18%, transparent 82%, ${fade} 100%)`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${fade} 0%, transparent 25%, transparent 75%, ${fade} 100%)`,
          }}
        />
      </div>
    </section>
  )
}
