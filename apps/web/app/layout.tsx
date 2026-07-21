import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Nav } from './components/Nav'
import { Providers } from './components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'MedicalBot',
  description: 'Personal health management assistant',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  )
}
