/**
 * CLI entry for seeding and resetting.
 *
 *   npm run db:seed   --workspace @medbot/api
 *   npm run db:reset  --workspace @medbot/api
 */
import { closeDb, runMigrations } from '../db/index.js'
import { resetDemoData, seedDemoData } from './index.js'

const command = process.argv[2]

try {
  await runMigrations()

  if (command === 'reset') {
    const { usersDeleted } = await resetDemoData()
    console.log(`Reset complete. Demo accounts removed: ${usersDeleted}`)
    console.log('Real accounts and the schema itself were not touched.')
  } else if (command === 'seed') {
    const { userId, metrics } = await seedDemoData()
    console.log(`Seeded demo account ${userId} with ${metrics} metric readings.`)
    console.log('Sign in at /auth/demo (requires DEMO_MODE=true).')
  } else {
    console.error(`Unknown command: ${command ?? '(none)'}. Expected "seed" or "reset".`)
    process.exitCode = 1
  }
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  await closeDb()
}
