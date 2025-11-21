'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

// Defaults (reading-blue, math-orange, sky-blue)
const DEFAULT_BRANDING = {
  primaryColor: '#1E90FF',
  secondaryColor: '#FF7A18',
  tertiaryColor: '#aa50ffff',
  quaternaryColor: '#ffd000ff',
  lightModeBackground: '#FFFFFF',
  lightModeText: '#0F172A',
  darkModeBackground: '#1d0b30ff',
  darkModeText: '#E5E7EB',
}

function adjustColor(hex: string, amount: number) {
  // amount: -1 to +1 (negative = darker, positive = lighter)
  hex = hex.replace('#', '')

  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Mix toward white (255,255,255) or black (0,0,0)
  const mix = (channel: number) => {
    if (amount >= 0) {
      // lighten → mix toward white
      return Math.round(channel + (255 - channel) * amount)
    } else {
      // darken → mix toward black
      return Math.round(channel * (1 + amount)) // amount is negative
    }
  }

  const toHex = (n: number) => n.toString(16).padStart(2, '0')

  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`
}


function applyBrandingToDocument(branding: Record<string, any>) {
  const root = document.documentElement
  const b = { ...DEFAULT_BRANDING, ...(branding || {}) }

  root.style.setProperty('--color-primary', b.primaryColor)
  root.style.setProperty('--color-secondary', b.secondaryColor)
  root.style.setProperty('--color-tertiary', b.tertiaryColor)
  root.style.setProperty('--color-quaternary', b.quaternaryColor)
  root.style.setProperty('--color-white', b.lightModeBackground)
  root.style.setProperty('--color-black', b.darkModeBackground)
  root.style.setProperty('--color-primary-dark', adjustColor(b.primaryColor, -0.75))
  root.style.setProperty('--color-secondary-dark', adjustColor(b.secondaryColor, -0.75))
  root.style.setProperty('--color-tertiary-dark', adjustColor(b.tertiaryColor, -0.75))
  root.style.setProperty('--color-quaternary-dark', adjustColor(b.quaternaryColor, -0.75))
  root.style.setProperty('--color-primary-light', adjustColor(b.primaryColor, 0.75))
  root.style.setProperty('--color-secondary-light', adjustColor(b.secondaryColor, 0.75))
  root.style.setProperty('--color-tertiary-light', adjustColor(b.tertiaryColor, 0.75))
  root.style.setProperty('--color-quaternary-light', adjustColor(b.quaternaryColor, 0.75))
  root.style.setProperty('--color-light-highlight', b.primaryColor)
  root.style.setProperty('--color-light-bg', b.lightModeBackground)
  root.style.setProperty('--color-light-text', b.lightModeText)
  root.style.setProperty('--color-dark-highlight', b.secondaryColor)
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
