import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config, isProduction } from '../config.js'
import * as schema from './schema.js'

const client = postgres(config.DATABASE_URL, {
  max: isProduction ? 10 : 3,
  // Railway's Postgres plugin terminates TLS at the proxy with a self-signed cert.
  ssl: isProduction ? { rejectUnauthorized: false } : false,
})

export const db = drizzle(client, { schema })
export { schema }

export async function closeDb(): Promise<void> {
  await client.end()
}

export async function pingDb(): Promise<boolean> {
  try {
    await client`select 1`
    return true
  } catch {
    return false
  }
}
