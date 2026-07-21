'use client'

import type { ReactNode } from 'react'
import { ToastProvider } from './Toast'

/** Client-side context providers mounted once at the root. */
export function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
