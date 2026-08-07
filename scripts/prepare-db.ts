import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required in production.')

const pool = new Pool({ connectionString, max: 2, connectionTimeoutMillis: 10_000 })

async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS petri_world (
        id integer PRIMARY KEY,
        status text NOT NULL DEFAULT 'stopped',
        started_at timestamptz,
        creatures jsonb NOT NULL DEFAULT '[]'::jsonb,
        food jsonb NOT NULL DEFAULT '[]'::jsonb,
        events jsonb NOT NULL DEFAULT '[]'::jsonb,
        births integer NOT NULL DEFAULT 0,
        deaths integer NOT NULL DEFAULT 0,
        generation integer NOT NULL DEFAULT 1,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    console.log('[petri] database ready')
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('[petri] database preparation failed', error)
  process.exitCode = 1
})
