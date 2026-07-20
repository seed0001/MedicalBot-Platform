import { PGlite } from '@electric-sql/pglite'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sql } from 'drizzle-orm'
import { config, isProduction } from '../config.js'
import * as schema from './schema.js'

/**
 * Two drivers behind one `db`.
 *
 * `pglite://<path>` runs Postgres embedded in this process against a local
 * directory — no install, no Docker, no container. That is what local
 * exploration uses. Anything else is treated as a normal connection string and
 * goes through postgres-js, which is what Railway uses.
 *
 * The query API is identical across both drivers, so call sites are typed
 * against the postgres-js database type and never branch on which one is live.
 */

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../drizzle')

export const usingPglite = config.DATABASE_URL.startsWith('pglite:')

type Db = ReturnType<typeof drizzlePostgres<typeof schema>>

let sqlClient: ReturnType<typeof postgres> | null = null
let pgliteClient: PGlite | null = null

function createDb(): Db {
  if (usingPglite) {
    // pglite://./.data/medbot -> ./.data/medbot
    const dataDir = resolve(config.DATABASE_URL.replace(/^pglite:\/\//, '') || './.data/medbot')
    // PGlite mkdirs its own leaf but not the parents, so a first run on a clean
    // checkout fails without this.
    mkdirSync(dirname(dataDir), { recursive: true })
    pgliteClient = new PGlite(dataDir)
    return drizzlePglite(pgliteClient, { schema }) as unknown as Db
  }

  sqlClient = postgres(config.DATABASE_URL, {
    max: isProduction ? 10 : 3,
    // Railway's Postgres plugin terminates TLS at the proxy with a self-signed cert.
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  })
  return drizzlePostgres(sqlClient, { schema })
}

export const db: Db = createDb()
export { schema }

/**
 * Applies pending migrations. PGlite has no external migrate step, so it runs
 * this at boot; hosted Postgres runs it from the deploy command.
 */
export async function runMigrations(): Promise<void> {
  if (usingPglite) {
    await migratePglite(db as never, { migrationsFolder: MIGRATIONS_DIR })
    return
  }
  await migratePostgres(db as never, { migrationsFolder: MIGRATIONS_DIR })
}

export async function closeDb(): Promise<void> {
  await sqlClient?.end()
  await pgliteClient?.close()
}

export async function pingDb(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`)
    return true
  } catch {
    return false
  }
}
