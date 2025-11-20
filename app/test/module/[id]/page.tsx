"use client"

import { useParams, useSearchParams } from "next/navigation"
import { EnglishModuleRunner } from "@/components/test-module/EnglishModuleRunner"
import { MathModuleRunner } from "@/components/test-module/MathModuleRunner"

// Container for the split layout
function ModuleSplitLayout({ children }: { children: [React.ReactNode, React.ReactNode] }) {
  return (
    <div
      className="w-full min-h-screen flex justify-center items-stretch bg-background"
      style={{ maxWidth: 1920, margin: '0 auto' }}
    >
      <div className="flex w-full h-full" style={{ minHeight: '100vh' }}>
        <div className="w-1/2 h-full flex flex-col px-0 py-0" style={{ borderRight: '1px solid var(--border-color, #e5e7eb)' }}>
          {children[0]}
        </div>
        <div className="w-1/2 h-full flex flex-col px-0 py-0">
          {children[1]}
        </div>
      </div>
    </div>
  )
}

export default function TestModulePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const moduleId = Number(params.id)
  const testId = parseInt(searchParams.get('testId') || '1', 10)
  const qParam = searchParams.get("question")

  // Use a split layout for the runner shell itself, not here
  // Just render the runner, which will use TestModuleShell for layout
  if (moduleId <= 2) {
    return (
      <div className="w-full min-h-screen flex justify-center items-stretch bg-background">
        <div className="flex w-full h-full" style={{ minHeight: '100vh' }}>
          <EnglishModuleRunner moduleId={moduleId} testId={testId} />
        </div>
      </div>
    )
  }
  return (
    <div className="w-full min-h-screen flex justify-center items-stretch bg-background">
      <div className="flex w-full h-full" style={{ minHeight: '100vh' }}>
        <MathModuleRunner moduleId={moduleId} testId={testId} />
      </div>
    </div>
  )
}