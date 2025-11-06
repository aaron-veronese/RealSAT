import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/toaster"
import 'katex/dist/katex.min.css'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SAT Practice",
  description: "Digital SAT practice test application",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
