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
  tertiaryColor: '#0EA5E9',
  // Muted values are computed from the color above at runtime (see applyBrandingToDocument),
  // keeping these defaults here for reference
  primaryMuted: 'rgba(30,144,255,0.08)',
  secondaryMuted: 'rgba(255,122,24,0.08)',
  tertiaryMuted: 'rgba(14,165,233,0.08)',
  lightModeBackground: '#FFFFFF',
  lightModeText: '#0F172A',
  darkModeBackground: '#1d0b30ff',
  darkModeText: '#E5E7EB',
}

function applyBrandingToDocument(branding: Record<string, any>) {
  const root = document.documentElement
  const b = { ...DEFAULT_BRANDING, ...(branding || {}) }

  // Helpers to compute a muted/darker translucent variant for a color
  const clamp = (n: number, min = 0, max = 255) => Math.min(max, Math.max(min, Math.round(n)))

  // Simplified: Theme selector only outputs hex colors; compute muted value via a simple
  // black overlay (opacity) and a translucent alpha background. This keeps logic
  // straightforward and avoids parsing/computing many different formats.
  const parseHex = (hex?: string): { r: number; g: number; b: number } | null => {
    if (!hex || typeof hex !== 'string') return null
    const h = hex.trim().replace('#', '')
    if (!/^[a-fA-F0-9]{3}$|^[a-fA-F0-9]{6}$/.test(h)) return null
    if (h.length === 3) {
      return {
        r: parseInt(h[0] + h[0], 16),
        g: parseInt(h[1] + h[1], 16),
        b: parseInt(h[2] + h[2], 16),
      }
    }
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    }
  }

  const darkenRgb = (rgb: { r: number; g: number; b: number }, amount = 0.14): { r: number; g: number; b: number } => {
    return {
      r: clamp(rgb.r * (1 - amount)),
      g: clamp(rgb.g * (1 - amount)),
      b: clamp(rgb.b * (1 - amount)),
    }
  }

  const rgbaFrom = (rgb: { r: number; g: number; b: number }, alpha = 0.08): string => `rgba(${clamp(rgb.r)}, ${clamp(rgb.g)}, ${clamp(rgb.b)}, ${alpha})`

  // Compute the muted color by applying a black overlay to the hex color.
  // overlayAlpha: amount of black overlay to darken the color (0.10–0.15 desired)
  // bgAlpha: final alpha for the motif background (low, e.g., 0.08)
  const computeMuted = (hexColor?: string, provide?: string, overlayAlpha = 0.15, bgAlpha = 0.08): string | undefined => {
    if (provide && typeof provide === 'string') return provide
    const rgb = parseHex(hexColor)
    if (!rgb) return undefined
    const factor = 1 - overlayAlpha
    const darkened = { r: clamp(rgb.r * factor), g: clamp(rgb.g * factor), b: clamp(rgb.b * factor) }
    return rgbaFrom(darkened, bgAlpha)
  }

  root.style.setProperty('--color-primary', b.primaryColor)
  root.style.setProperty('--color-secondary', b.secondaryColor)
  root.style.setProperty('--color-tertiary', b.tertiaryColor)
  // Backwards compatibility aliases used across the app
  root.style.setProperty('--color-reading', b.primaryColor)
  root.style.setProperty('--color-math', b.secondaryColor)
  root.style.setProperty('--color-tertiary', b.tertiaryColor)
  root.style.setProperty('--color-primary-muted', computeMuted(b.primaryColor, b.primaryMuted, 0.15, 0.08) || (b.primaryMuted || 'rgba(30,144,255,0.08)'))
  root.style.setProperty('--color-secondary-muted', computeMuted(b.secondaryColor, b.secondaryMuted, 0.15, 0.08) || (b.secondaryMuted || 'rgba(255,122,24,0.08)'))
  root.style.setProperty('--color-tertiary-muted', computeMuted(b.tertiaryColor, b.tertiaryMuted, 0.15, 0.08) || (b.tertiaryMuted || 'rgba(14,165,233,0.08)'))
  // Backwards compatibility aliases for muted variants
  root.style.setProperty('--color-reading-muted', computeMuted(b.primaryColor, b.primaryMuted, 0.15, 0.08) || (b.primaryMuted || 'rgba(30,144,255,0.08)'))
  root.style.setProperty('--color-math-muted', computeMuted(b.secondaryColor, b.secondaryMuted, 0.15, 0.08) || (b.secondaryMuted || 'rgba(255,122,24,0.08)'))
  root.style.setProperty('--color-tertiary-muted', computeMuted(b.tertiaryColor, b.tertiaryMuted, 0.15, 0.08) || (b.tertiaryMuted || 'rgba(14,165,233,0.08)'))
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
