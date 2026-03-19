import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CellarTrack Pro — Smart wine inventory",
  description: "Track your wine collection with automated market pricing updates and aging alerts.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  )
}
