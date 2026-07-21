import type { FastifyInstance } from 'fastify'
import { asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { openRouterConfigured } from '../config.js'
import { db, schema } from '../db/index.js'
import { runAgent } from '../ai/agent.js'
import type { ChatMessage } from '../ai/openrouter.js'
import { requireUser } from './auth.js'

/**
 * Conversational assistant (SPEC §4). Each turn assembles context, runs the
 * tool-using agent, and persists both sides of the exchange so the thread
 * survives reloads. If OpenRouter is not configured the endpoint says so
 * plainly rather than failing cryptically.
 */
export async function assistantRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUser)

  app.get('/assistant/history', async (request, reply) => {
    const userId = request.session.userId!
    const rows = await db
      .select({
        role: schema.conversations.role,
        content: schema.conversations.content,
        createdAt: schema.conversations.createdAt,
      })
      .from(schema.conversations)
      .where(eq(schema.conversations.userId, userId))
      .orderBy(asc(schema.conversations.createdAt))
      .limit(200)
    return reply.send({ messages: rows, configured: openRouterConfigured })
  })

  app.delete('/assistant/history', async (request, reply) => {
    const userId = request.session.userId!
    await db.delete(schema.conversations).where(eq(schema.conversations.userId, userId))
    return reply.send({ ok: true })
  })

  const chatBody = z.object({
    message: z.string().min(1).max(4000),
    personaId: z.string().max(60).default('maya'),
  })

  app.post('/assistant/chat', async (request, reply) => {
    if (!openRouterConfigured) {
      return reply.code(503).send({
        error: 'The assistant is not configured yet. Set OPENROUTER_API_KEY to enable it.',
        configured: false,
      })
    }

    const parsed = chatBody.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid message', issues: parsed.error.issues })
    }
    const userId = request.session.userId!
    const { message, personaId } = parsed.data

    // Recent turns for continuity (most recent 20, back into chronological order).
    const recent = await db
      .select({ role: schema.conversations.role, content: schema.conversations.content })
      .from(schema.conversations)
      .where(eq(schema.conversations.userId, userId))
      .orderBy(desc(schema.conversations.createdAt))
      .limit(20)
    const history: ChatMessage[] = recent
      .reverse()
      .map((r) => ({ role: r.role as ChatMessage['role'], content: r.content }))

    try {
      const turn = await runAgent({ userId, personaId, history, message })

      await db.insert(schema.conversations).values([
        { userId, role: 'user', content: message },
        {
          userId,
          role: 'assistant',
          content: turn.reply,
          model: turn.model,
          toolCalls: turn.toolCalls.length ? turn.toolCalls : null,
        },
      ])

      return reply.send({ reply: turn.reply, actions: turn.actions, model: turn.model })
    } catch (err) {
      request.log.error({ err: err instanceof Error ? err.message : 'unknown' }, 'Assistant turn failed')
      return reply.code(502).send({ error: 'The assistant had trouble responding. Please try again.' })
    }
  })
}
