import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, string> = { app: 'ok' }
  let healthy = true
  try { await pool.query('select 1'); checks.database = 'ok' } catch { checks.database = 'error'; healthy = false }
  if (redis) {
    try { await redis.ping(); checks.redis = 'ok' } catch { checks.redis = 'error'; healthy = false }
  } else checks.redis = 'not_configured'
  return NextResponse.json({ status: healthy ? 'ok' : 'degraded', checks, timestamp: new Date().toISOString() }, { status: healthy ? 200 : 503 })
}
