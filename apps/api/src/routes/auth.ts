import { randomBytes } from 'node:crypto'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { eq } from 'drizzle-orm'
import { config, googleConfigured } from '../config.js'
import { db, schema } from '../db/index.js'
import { encrypt } from '../lib/crypto.js'

/**
 * Google OAuth. Scopes are requested incrementally (SPEC.md §6) — login asks
 * only for identity. Calendar, Drive, and Gmail are granted later from settings,
 * so a new user is not confronted with a wall of permissions at signup.
 */

const LOGIN_SCOPES = ['openid', 'email', 'profile']

export const INCREMENTAL_SCOPES = {
  calendar: ['https://www.googleapis.com/auth/calendar.events'],
  drive: ['https://www.googleapis.com/auth/drive.file'],
  tasks: ['https://www.googleapis.com/auth/tasks'],
  gmail_read: ['https://www.googleapis.com/auth/gmail.readonly'],
} as const

declare module 'fastify' {
  interface Session {
    userId?: string
    oauthState?: string
  }
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get('/auth/google', async (request, reply) => {
    if (!googleConfigured) {
      return reply.code(503).send({ error: 'Google OAuth is not configured' })
    }

    const state = randomBytes(16).toString('hex')
    request.session.oauthState = state

    const params = new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID!,
      redirect_uri: config.GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      scope: LOGIN_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    })

    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  })

  app.get<{ Querystring: { code?: string; state?: string } }>(
    '/auth/google/callback',
    async (request, reply) => {
      const { code, state } = request.query

      if (!code || !state || state !== request.session.oauthState) {
        return reply.code(400).send({ error: 'Invalid OAuth callback' })
      }
      request.session.oauthState = undefined

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: config.GOOGLE_CLIENT_ID!,
          client_secret: config.GOOGLE_CLIENT_SECRET!,
          redirect_uri: config.GOOGLE_REDIRECT_URI!,
          grant_type: 'authorization_code',
        }),
      })

      if (!tokenResponse.ok) {
        request.log.error({ status: tokenResponse.status }, 'Google token exchange failed')
        return reply.code(502).send({ error: 'Google token exchange failed' })
      }

      const tokens = (await tokenResponse.json()) as {
        access_token: string
        refresh_token?: string
        expires_in: number
        scope: string
      }

      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })

      if (!profileResponse.ok) {
        return reply.code(502).send({ error: 'Could not read Google profile' })
      }

      const googleProfile = (await profileResponse.json()) as {
        sub: string
        email: string
        name?: string
      }

      const userId = await upsertUser(googleProfile, tokens)
      request.session.userId = userId

      return reply.redirect(config.APP_URL)
    },
  )

  app.post('/auth/logout', async (request, reply) => {
    await request.session.destroy()
    return reply.send({ ok: true })
  })

  app.get('/auth/me', async (request, reply) => {
    const userId = request.session.userId
    if (!userId) return reply.code(401).send({ error: 'Not authenticated' })

    const [user] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        onboardedAt: schema.users.onboardedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)

    if (!user) return reply.code(401).send({ error: 'Not authenticated' })
    return reply.send(user)
  })
}

async function upsertUser(
  profile: { sub: string; email: string; name?: string },
  tokens: { access_token: string; refresh_token?: string; expires_in: number; scope: string },
): Promise<string> {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(schema.users)
      .values({ googleId: profile.sub, email: profile.email })
      .onConflictDoUpdate({
        target: schema.users.googleId,
        set: { email: profile.email, updatedAt: new Date() },
      })
      .returning({ id: schema.users.id })

    const userId = user!.id

    await tx
      .insert(schema.profiles)
      .values({ userId, displayName: profile.name ?? profile.email })
      .onConflictDoNothing()

    await tx
      .insert(schema.googleAccounts)
      .values({
        userId,
        accessToken: tokens.access_token,
        // Google only returns a refresh token on first consent; keep the stored
        // one when this exchange did not include a new one.
        refreshTokenEncrypted: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scopes: tokens.scope.split(' '),
      })
      .onConflictDoUpdate({
        target: schema.googleAccounts.userId,
        set: {
          accessToken: tokens.access_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          scopes: tokens.scope.split(' '),
          updatedAt: new Date(),
        },
      })

    return userId
  })
}

/** preHandler that rejects unauthenticated requests. */
export async function requireUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session.userId) {
    await reply.code(401).send({ error: 'Not authenticated' })
  }
}
