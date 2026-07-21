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
  if (!res.ok) throw new ApiError(path, res.status, await safeBody(res))
  return (await res.json()) as T
}

export async function apiPatch<T>(path: string, body: unknown = {}): Promise<T> {
  const res = await apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) })
  if (res.status === 401) throw new NotAuthenticated()
  if (!res.ok) throw new ApiError(path, res.status, await safeBody(res))
  return (await res.json()) as T
}

/**
 * Fastify rejects an empty body sent with a JSON content-type, so a bodyless
 * DELETE has to carry an empty object.
 */
export async function apiDelete<T>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: 'DELETE', body: '{}' })
  if (res.status === 401) throw new NotAuthenticated()
  if (!res.ok) throw new ApiError(path, res.status, await safeBody(res))
  return (await res.json()) as T
}

export class ApiError extends Error {
  constructor(
    public path: string,
    public status: number,
    public body: unknown,
  ) {
    super(`${path} failed: ${status}`)
    this.name = 'ApiError'
  }
}

async function safeBody(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}
