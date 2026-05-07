"use client"

import * as React from "react"
import { Player } from "@remotion/player"
import { PerspectiveMarquee } from "@/components/ui/remocn-perspective-marquee"

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

function PerspectiveMarqueeScene({ isDark }: { isDark: boolean }) {
  return (
    <PerspectiveMarquee
      items={[
        "Suraksha",
        "Safety",
        "Tracking",
        "Alerts",
        "SOS",
        "Protection",
        "Support",
        "Confidence",
      ]}
      rotateY={-28}
      rotateX={8}
      perspective={1200}
      pixelsPerFrame={2}
      background={isDark ? "#050505" : "#fafafa"}
      fadeColor={isDark ? "#050505" : "#fafafa"}
      color={isDark ? "#fafafa" : "#171717"}
      fontSize={80}
    />
  )
}

export default function PerspectiveMarqueeSection() {
  const isDark = usePrefersDark()

  return (
    <section id="partners-marquee" className="relative border-y border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-5">
        <p className="section-label text-center">Trusted Technology Stack</p>
      </div>
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "50vh", minHeight: "320px", maxHeight: "520px" }}
      >
        <Player
          component={PerspectiveMarqueeScene}
          inputProps={{ isDark }}
          acknowledgeRemotionLicense
          durationInFrames={240}
          fps={30}
          compositionWidth={1280}
          compositionHeight={720}
          style={{ width: "100%", height: "100%" }}
          controls={false}
          autoPlay
          loop
          clickToPlay={false}
        />
      </div>
    </section>
  )
}
