import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google"
import "./admin.css"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
})

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} font-body min-h-screen bg-[#000000] text-white`}
    >
      {children}
    </div>
  )
}
