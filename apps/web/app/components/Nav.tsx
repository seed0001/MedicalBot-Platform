'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Modal } from './Modal'
import { MetricEntryForm } from './MetricEntryForm'

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/assistant', label: 'Assistant' },
  { href: '/metrics', label: 'Metrics' },
  { href: '/medications', label: 'Medications' },
  { href: '/assessments', label: 'Assessments' },
  { href: '/conditions', label: 'Conditions' },
  { href: '/appointments', label: 'Appointments' },
  { href: '/records', label: 'Records' },
  { href: '/profile', label: 'Profile' },
  { href: '/settings', label: 'Settings' },
]

const HIDDEN_ON = new Set(['/', '/terms', '/privacy', '/onboarding'])

export function Nav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  // The marketing page, legal pages, and the gated intake flow render bare.
  if (HIDDEN_ON.has(pathname)) return null

  async function signOut() {
    await apiFetch('/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <>
      <nav className="app-nav">
        <div className="app-nav-inner">
          <Link href="/dashboard" className="brand">
            MedicalBot
          </Link>

          <button
            type="button"
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            ☰
          </button>

          <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={pathname.startsWith(link.href) ? 'active' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="nav-right">
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => setLogOpen(true)}
            >
              + Log
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <Modal open={logOpen} title="Log a reading" onClose={() => setLogOpen(false)} wide>
        <MetricEntryForm onDone={() => setLogOpen(false)} />
      </Modal>
    </>
  )
}
