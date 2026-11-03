import type { Metadata, Viewport } from "next"
import { Figtree, Fraunces } from "next/font/google"
import "./globals.css"

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
})

export const metadata: Metadata = {
  title: {
    default: "Expiry Everything",
    template: "%s · Expiry Everything",
  },
  description:
    "A shared board for passports, licenses, warranties, medications, and makeup — the dates a household forgets.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4efe6",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${figtree.variable} ${fraunces.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
