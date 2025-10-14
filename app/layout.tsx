import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Playfair_Display } from "next/font/google"
import Navbar from "@/components/navbar"
import TransitionProvider from "@/components/transition-provider"
import ChunkErrorHandler from "@/components/chunk-error-handler"
import PWAInstallPrompt from "@/components/pwa-install-prompt"
import NetworkStatus from "@/components/network-status"
import { Suspense } from "react"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "TempleTrail - Spiritual Journey Planner",
  description: "Plan your multi-day spiritual journey across India's sacred temples. Discover, explore, and create optimized itineraries for temple visits.",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["temples", "spiritual", "journey", "India", "travel", "pilgrimage", "itinerary", "sacred"],
  authors: [{ name: "TempleTrail" }],
  creator: "TempleTrail",
  publisher: "TempleTrail",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://templetrail.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "TempleTrail - Spiritual Journey Planner",
    description: "Plan your multi-day spiritual journey across India's sacred temples",
    url: 'https://templetrail.app',
    siteName: 'TempleTrail',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TempleTrail - Plan your spiritual journey',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "TempleTrail - Spiritual Journey Planner",
    description: "Plan your multi-day spiritual journey across India's sacred temples",
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TempleTrail",
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${playfair.variable} antialiased`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TempleTrail" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://places.googleapis.com" />
        <link rel="preconnect" href="https://routes.googleapis.com" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        <link rel="dns-prefetch" href="https://places.googleapis.com" />
        <link rel="dns-prefetch" href="https://routes.googleapis.com" />
      </head>
      <body className="font-sans touch-manipulation">
        <ChunkErrorHandler />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <Navbar />
          <NetworkStatus />
          <TransitionProvider>{children}</TransitionProvider>
          <PWAInstallPrompt />
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
