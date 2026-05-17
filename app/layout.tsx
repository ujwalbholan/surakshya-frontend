import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Suspense } from 'react'
import SplashScreen from '@/components/SplashScreen'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Suraksha - The Guardian On Your Wrist',
  description: 'Suraksha is a women\'s safety IoT wearable band and mobile app. One tap sends your live GPS location to family and emergency contacts instantly.',
  keywords: ['women safety', 'IoT wearable', 'GPS tracking', 'SOS band', 'personal safety'],
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body className="font-sans antialiased bg-background text-foreground overflow-hidden" style={{ background: '#000000', color: '#ffffff' }}>
        {/* Critical: prevent white flash (FOUC) before CSS loads */}
        <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#000000!important;color:#ffffff}' }} />
        <Suspense fallback={null}>
          <SplashScreen />
        </Suspense>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
