import type { FastifyInstance } from 'fastify'
import { LOGIN_REMINDER, TERMS_SUMMARY, TERMS_VERSION } from '@medbot/shared'

export async function legalRoutes(app: FastifyInstance): Promise<void> {
  app.get('/legal', async () => ({
    version: TERMS_VERSION,
    summary: TERMS_SUMMARY,
    loginReminder: LOGIN_REMINDER,
    termsPath: '/terms',
    privacyPath: '/privacy',
  }))
}
