"use client"

import { useScrollReveal } from "@/hooks/useScrollReveal"

export default function GSAPScrollProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useScrollReveal()
  return <>{children}</>
}
