"use client"

import { useParams, useSearchParams } from "next/navigation"
import { EnglishModuleRunner } from "@/components/test-module/EnglishModuleRunner"
import { MathModuleRunner } from "@/components/test-module/MathModuleRunner"

export default function TestModulePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const moduleId = Number(params.id)
  const testId = parseInt(searchParams.get('testId') || '1', 10)
  const qParam = searchParams.get("question")

  if (moduleId <= 2) {
    return <EnglishModuleRunner moduleId={moduleId} testId={testId} />
  }
  return <MathModuleRunner moduleId={moduleId} testId={testId} />
}