'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastKind = 'ok' | 'err' | 'info'
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastApi {
  show: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastApi | null>(null)

let nextId = 1

/**
 * App-wide transient notifications. Mounted once at the root so any client
 * component can call `useToast().show(...)` after a save without threading state.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, kind: ToastKind = 'ok') => {
    const id = nextId++
    setToasts((t) => [...t, { id, kind, message }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`} role="status">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  // A no-op fallback keeps components usable if rendered outside the provider.
  return ctx ?? { show: () => undefined }
}
