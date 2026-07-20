/**
 * Empty by default: the API serves this app, so requests are same-origin and
 * relative. Only set NEXT_PUBLIC_API_URL if the API lives elsewhere.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

export class NotAuthenticated extends Error {
  constructor() {
    super('Not authenticated')
    this.name = 'NotAuthenticated'
  }
}

/** GET returning parsed JSON. Throws NotAuthenticated on 401 so pages can
 *  redirect to sign-in instead of rendering an empty shell. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path)
  if (res.status === 401) throw new NotAuthenticated()
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
  return (await res.json()) as T
}

export async function apiPost<T>(path: string, body: unknown = {}): Promise<T> {
  const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) })
  if (res.status === 401) throw new NotAuthenticated()
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
  return (await res.json()) as T
}
