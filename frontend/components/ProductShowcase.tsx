"use client"

import { useCallback, useState } from "react"
import dynamic from "next/dynamic"
import { useFloating, offset, flip, shift, useHover, useInteractions, useDismiss, FloatingPortal } from "@floating-ui/react"
import Crosshairs from "@/components/Crosshairs"

const ShowcaseWristband = dynamic(() => import("@/components/showcase/ShowcaseWristband"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-transparent" aria-hidden="true" />,
})

const tabs = [
  {
    id: "sos",
    label: "One Tap SOS",
    description: "A single tap triggers an instant SOS alert. Your GPS coordinates are sent to emergency contacts in real-time. No phone needed.",
  },
  {
    id: "tracking",
    label: "Live Tracking",
    description: "Real-time GPS tracking lets your family know exactly where you are. Share your live route with trusted contacts during commutes.",
  },
  {
    id: "safewalk",
    label: "Safe Walk",
    description: "Activate Safe Walk mode and your path is monitored continuously. If you deviate or stop unexpectedly, alerts are sent automatically.",
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Automatically captures audio and location data when SOS is triggered. Secure, encrypted evidence that can be shared with authorities.",
  },
]

/* Left sidebar section indicators like lightweight.info */
const sidebarSections = [
  { num: "01", label: "PHILOSOPHY" },
  { num: "02", label: "CRAFT" },
  { num: "03", label: "INNOVATION" },
]

function TabTooltip({ tab }: { tab: typeof tabs[0] }) {
  const [isOpen, setIsOpen] = useState(false)
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(12), flip(), shift()],
    placement: "top",
  })

  const hover = useHover(context, { move: false, delay: { open: 100, close: 100 } })
  const dismiss = useDismiss(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, dismiss])
  const setReferenceRef = useCallback(
    (node: HTMLButtonElement | null) => {
      refs.setReference(node)
    },
    [refs]
  )
  const setFloatingRef = useCallback(
    (node: HTMLDivElement | null) => {
      refs.setFloating(node)
    },
    [refs]
  )

  return (
    <>
      <button
        ref={setReferenceRef}
        {...getReferenceProps()}
        className={`px-4 py-3 lg:px-6 lg:py-4 text-xs lg:text-sm tracking-[0.15em] uppercase transition-all duration-300 border-b-2 ${
          isOpen
            ? "border-crimson text-[#FAFAFA]"
            : "border-transparent text-[#888888] hover:text-[#FAFAFA]"
        }`}
      >
        {tab.label}
      </button>
      <FloatingPortal>
        <div
          ref={setFloatingRef}
          style={{
            ...floatingStyles,
            visibility: isOpen ? "visible" : "hidden",
            pointerEvents: isOpen ? "auto" : "none",
          }}
          {...getFloatingProps()}
          className="z-50 max-w-xs px-5 py-4 border border-[#222222] bg-[#111111]/95 backdrop-blur-md shadow-2xl"
        >
          <p className="text-sm text-[#FAFAFA]/80 leading-relaxed">
            {tab.description}
          </p>
        </div>
      </FloatingPortal>
    </>
  )
}

export default function ProductShowcase() {
  return (
    <section id="product" className="relative py-24 lg:py-40 px-6 lg:px-10">
      <Crosshairs />

      {/* Left sidebar section indicators like lightweight.info */}
      <div className="hidden lg:flex flex-col gap-6 absolute left-8 top-8 z-10">
        {sidebarSections.map((sec) => (
          <div key={sec.num} className="flex flex-col">
            <span className="text-xs text-[#888888] font-light">{sec.num}</span>
            <span className="text-xs font-bold tracking-[0.15em] text-[#FAFAFA]">{sec.label}</span>
          </div>
        ))}
      </div>

      {/* Center vertical crosshair line */}
      <div className="hidden lg:block absolute left-1/2 top-10 bottom-10 w-px bg-[#FAFAFA]/5" />

      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: Flutter-matched wristband (spin / tumble / float) */}
          <div className="relative w-full aspect-square max-w-lg mx-auto lg:mx-0" data-reveal="fade-right">
            <ShowcaseWristband />
          </div>

          {/* Right: Content */}
          <div className="flex flex-col" data-reveal="fade-left">
            <p className="section-label mb-4">Evolution</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-[#FAFAFA] uppercase mb-6">
              Surakshya Band
            </h2>
            <p className="text-base lg:text-lg text-[#888888] leading-relaxed mb-8 max-w-md">
              The all-new Surakshya Band continues our legacy with a completely re-engineered safety wearable built for instant alerts, precision GPS tracking, and seamless connectivity. First to feature dual-mode SOS technology, it handles emergencies with unmatched reliability.
            </p>

            {/* White rounded pill button */}
            <div>
              <a
                href="#innovation"
                className="inline-flex items-center justify-center px-10 py-4 bg-[#FAFAFA] text-[#0A0A0A] text-sm font-medium tracking-[0.12em] uppercase rounded-full transition-all duration-300 hover:bg-[#FAFAFA]/90 hover:scale-105"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Feature Tabs */}
        <div
          className="mt-12 lg:mt-16 flex flex-wrap items-center justify-center gap-1 border-b border-[#222222]"
          data-reveal="fade-up"
          data-reveal-delay="400"
        >
          {tabs.map((tab) => (
            <TabTooltip key={tab.id} tab={tab} />
          ))}
        </div>
      </div>
    </section>
  )
}
