'use client'

import { useEffect, useState } from 'react'

const KEY = 'medbot_theme'
type Theme = 'light' | 'dark'

/**
 * Light/dark switch. The choice is stored in localStorage and applied as
 * `data-theme` on <html>; an inline script in the layout applies it before
 * paint to avoid a flash. With no stored choice the app follows the OS setting.
 */
export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(KEY)
    if (stored === 'dark' || stored === 'light') setTheme(stored)
    else setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  }, [])

  function apply(next: Theme) {
    setTheme(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* ignore storage errors */
    }
    document.documentElement.setAttribute('data-theme', next)
  }

  const isDark = theme === 'dark'
  const next: Theme = isDark ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="btn-ghost btn-sm"
      onClick={() => apply(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === null ? '◐' : isDark ? '☀️' : '🌙'}
      {withLabel && <span> {isDark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  )
}
