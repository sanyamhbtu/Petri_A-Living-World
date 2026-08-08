import { Pool } from 'pg'

const schemaSql = `
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
`

export async function prepareDatabase() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in production.')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 10_000 })
  try {
    await pool.query(schemaSql)
  } finally {
    await pool.end()
  }
}
