
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const router = useRouter()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-4xl font-bold mb-8">Welcome to skoon.</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button className="w-full" onClick={() => router.push('/login')}>Login</Button>
        <Button className="w-full" onClick={() => router.push('/student')}>Student Dashboard</Button>
        <Button className="w-full" onClick={() => router.push('/teacher')}>Teacher Dashboard</Button>
        <Button className="w-full" onClick={() => router.push('/tutor')}>Tutor Dashboard</Button>
        <Button className="w-full" onClick={() => router.push('/admin')}>Admin Dashboard</Button>
        <Button className="w-full" onClick={() => router.push('/school')}>School Dashboard</Button>
        <Button className="w-full bg-gradient-to-r to-purple-600 text-white" style={{ backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' }} onClick={() => router.push('/test/module/1/intro')}>Start Test</Button>
      </div>
    </div>
  )
}
