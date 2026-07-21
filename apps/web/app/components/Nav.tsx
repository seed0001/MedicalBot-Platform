'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/metrics', label: 'Metrics' },
  { href: '/medications', label: 'Medications' },
  { href: '/appointments', label: 'Appointments' },
  { href: '/conditions', label: 'Conditions' },
  { href: '/questionnaires', label: 'Assessments' },
  { href: '/profile', label: 'Profile' },
  { href: '/settings', label: 'Settings' },
]

export function Nav() {
  const pathname = usePathname()
  // The marketing page, legal pages, and the signup intake flow render without
  // the app chrome — intake is a focused, gated step, not a browsable section.
  if (
    pathname === '/' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/onboarding'
  )
    return null

  return (
    <nav className="app-nav">
      <div className="app-nav-inner">
        <Link href="/dashboard" className="brand">
          MedicalBot
        </Link>
        <ul>
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={pathname.startsWith(link.href) ? 'active' : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
