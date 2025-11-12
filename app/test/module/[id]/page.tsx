"use client"

import { useParams, useSearchParams } from "next/navigation"
import { EnglishModuleRunner } from "@/components/test-module/EnglishModuleRunner"
import { MathModuleRunner } from "@/components/test-module/MathModuleRunner"

export default function TestModulePage() {
  const params = useParams()
  const moduleId = Number(params.id)
  // preserve deep link question param
  const searchParams = useSearchParams()
  const qParam = searchParams.get("question")

  if (moduleId <= 2) {
    return <EnglishModuleRunner moduleId={moduleId} />
  }
  return <MathModuleRunner moduleId={moduleId} />
}