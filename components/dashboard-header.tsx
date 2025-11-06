"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen } from "lucide-react"

export function DashboardHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <span>SAT Mirror</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className={pathname === "/" ? "font-medium" : "text-muted-foreground"}>
            Home
          </Link>
          <Link href="/test/new" className={pathname.startsWith("/test") ? "font-medium" : "text-muted-foreground"}>
            Practice Tests
          </Link>
        </nav>
      </div>
    </header>
  )
}
