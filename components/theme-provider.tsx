'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

// Defaults (reading-blue, math-orange, sky-blue)
const DEFAULT_BRANDING = {
  readingColor: '#1E90FF',
  mathColor: '#FF7A18',
  tertiaryColor: '#0EA5E9',
  lightModeHighlight: '#0EA5E9',
  lightModeBackground: '#FFFFFF',
  lightModeText: '#0F172A',
  darkModeHighlight: '#F59E0B',
  darkModeBackground: '#1d0b30ff',
  darkModeText: '#E5E7EB',
}

function applyBrandingToDocument(branding: Record<string, any>) {
  const root = document.documentElement
  const b = { ...DEFAULT_BRANDING, ...(branding || {}) }

  root.style.setProperty('--color-reading', b.readingColor)
  root.style.setProperty('--color-math', b.mathColor)
  root.style.setProperty('--color-tertiary', b.tertiaryColor)
  root.style.setProperty('--color-light-highlight', b.lightModeHighlight)
  root.style.setProperty('--color-light-bg', b.lightModeBackground)
  root.style.setProperty('--color-light-text', b.lightModeText)
  root.style.setProperty('--color-dark-highlight', b.darkModeHighlight)
  root.style.setProperty('--color-dark-bg', b.darkModeBackground)
  root.style.setProperty('--color-dark-text', b.darkModeText)
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    // Try to read school branding from localStorage; this lets the tutor dashboard
    // update branding client-side when a tutor/owner changes branding.
    try {
      const raw = localStorage.getItem('school_branding')
      const branding = raw ? JSON.parse(raw) : null
      applyBrandingToDocument(branding)
    } catch (err) {
      // If anything fails, apply defaults
      applyBrandingToDocument(DEFAULT_BRANDING)
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'school_branding') {
        try {
          const b = event.newValue ? JSON.parse(event.newValue) : null
          applyBrandingToDocument(b)
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
