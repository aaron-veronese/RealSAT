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

}

function adjustColor(color: string, amount: number) {
  // Blend the color with the globals.css light or dark background depending on the current theme
  // amount: 0 = original color, 1 = all background
  // Light: #ffffff (globals.css :root --background)
  // Dark: #050a15 (globals.css :root.dark --background)
  let bgColor = '#ffffff';
  if (typeof window !== 'undefined') {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      bgColor = '#050a15';
    } else {
      bgColor = '#ffffff';
    }
  }
  function hexToRgb(hex: string) {
    hex = hex.replace('#', '');
    return [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
    ];
  }
  function rgbToHex(r: number, g: number, b: number) {
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  }
  const [r1, g1, b1] = hexToRgb(color);
  const [r2, g2, b2] = hexToRgb(bgColor);
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return rgbToHex(r, g, b);
}


function applyBrandingToDocument(branding: Record<string, any>) {
  const root = document.documentElement
  const b = { ...DEFAULT_BRANDING, ...(branding || {}) }

  root.style.setProperty('--color-primary', b.primaryColor)
  root.style.setProperty('--color-secondary', b.secondaryColor)
  root.style.setProperty('--color-tertiary', b.tertiaryColor)
  root.style.setProperty('--color-quaternary', b.quaternaryColor)
  root.style.setProperty('--color-primary-faded', adjustColor(b.primaryColor, 0.85))
  root.style.setProperty('--color-secondary-faded', adjustColor(b.secondaryColor, 0.85))
  root.style.setProperty('--color-tertiary-faded', adjustColor(b.tertiaryColor, 0.85))
  root.style.setProperty('--color-quaternary-faded', adjustColor(b.quaternaryColor, 0.85))
  root.style.setProperty('--color-light-highlight', adjustColor(b.primaryColor, 0.25))
  root.style.setProperty('--color-dark-highlight', adjustColor(b.secondaryColor, 0.1))
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    // Apply branding initially and whenever branding in localStorage changes
    const applyCurrentBranding = () => {
      try {
        const raw = localStorage.getItem('school_branding')
        const branding = raw ? JSON.parse(raw) : null
        applyBrandingToDocument(branding)
      } catch {
        applyBrandingToDocument(DEFAULT_BRANDING)
      }
    }

    applyCurrentBranding()

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

    // Watch for theme toggles (dark class added/removed on <html>) and re-apply branding
    const root = document.documentElement
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && (m as MutationRecord).attributeName === 'class') {
          applyCurrentBranding()
          break
        }
      }
    })
    mo.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => {
      window.removeEventListener('storage', onStorage)
      mo.disconnect()
    }
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
