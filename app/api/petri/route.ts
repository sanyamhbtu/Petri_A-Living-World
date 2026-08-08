import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { createInitialSnapshot } from '@/components/petri/simulation'
import { WORLD_HEIGHT, WORLD_WIDTH } from '@/components/petri/types'
import type { WorldEvent, WorldSnapshot } from '@/components/petri/types'
import { db } from '@/lib/db'
import { petriWorld } from '@/lib/db/schema'
import { PETRI_CACHE_KEY, PETRI_SNAPSHOT_KEY, redis } from '@/lib/redis'

const ADMIN_PASSWORD_HASH = '80585c5c69ad3b293a62fdee09f5ab7f2f8cb6f2078eb1cf7c96da89f8e26235'
const SNAPSHOT_INTERVAL_MS = 15_000
let lastInProcessSnapshot = 0

type CachedWorld = WorldSnapshot & { updatedAt?: number }

function serializeWorld(row: typeof petriWorld.$inferSelect): WorldSnapshot {
  return {
    creatures: row.creatures as WorldSnapshot['creatures'],
    food: row.food as WorldSnapshot['food'],
    events: row.events as WorldSnapshot['events'],
    births: row.births,
    deaths: row.deaths,
    generation: row.generation,
    status: row.status as WorldSnapshot['status'],
    startedAt: row.startedAt?.getTime() ?? 0,
  }
}

function nowWorld(world: WorldSnapshot): CachedWorld {
  return { ...world, updatedAt: Date.now() }
}

async function readCache() {
  return redis ? await redis.get<CachedWorld>(PETRI_CACHE_KEY) : null
}

async function getOrCreateWorld() {
  const cached = await readCache()
  if (cached) return cached
  const existing = await db.select().from(petriWorld).where(eq(petriWorld.id, 1)).limit(1)
  if (existing[0]) {
    const world = nowWorld(serializeWorld(existing[0]))
    if (redis) await redis.set(PETRI_CACHE_KEY, world)
    return world
  }
  const initial = createInitialSnapshot()
  const inserted = await db.insert(petriWorld).values({
    id: 1,
    status: 'stopped',
    creatures: initial.creatures,
    food: initial.food,
    events: initial.events,
    births: 0,
    deaths: 0,
    generation: 1,
  }).returning()
  const world = nowWorld(serializeWorld(inserted[0]))
  if (redis) await redis.set(PETRI_CACHE_KEY, world)
  return world
}

async function writeCache(world: WorldSnapshot) {
  if (redis) await redis.set(PETRI_CACHE_KEY, nowWorld(world))
}

async function snapshotToNeon(world: WorldSnapshot) {
  const current = await db.select().from(petriWorld).where(eq(petriWorld.id, 1)).limit(1)
  if (!current[0]) return
  await db.update(petriWorld).set({
    status: world.status,
    startedAt: world.startedAt ? new Date(world.startedAt) : null,
    creatures: world.creatures,
    food: world.food,
    events: world.events,
    births: world.births,
    deaths: world.deaths,
    generation: world.generation,
    updatedAt: new Date(),
  }).where(eq(petriWorld.id, 1))
  if (redis) await redis.set(PETRI_SNAPSHOT_KEY, Date.now())
}

async function persistHotWorld(world: WorldSnapshot, durable = false) {
  await writeCache(world)
  if (durable) {
    await snapshotToNeon(world)
    return
  }
  const lastSnapshot = redis ? await redis.get<number>(PETRI_SNAPSHOT_KEY) : lastInProcessSnapshot
  if (!lastSnapshot || Date.now() - lastSnapshot > SNAPSHOT_INTERVAL_MS) {
    lastInProcessSnapshot = Date.now()
    await snapshotToNeon(world)
  }
}

export async function GET() {
  try {
    return NextResponse.json(await getOrCreateWorld(), { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'The Petri cache and database are unavailable.' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: 'start' | 'restart' | 'feed'; password?: string; x?: number; y?: number }
    const current = await getOrCreateWorld()
    if (body.action === 'feed') {
      const x = typeof body.x === 'number' && Number.isFinite(body.x) ? Math.max(0, Math.min(WORLD_WIDTH, body.x)) : null
      const y = typeof body.y === 'number' && Number.isFinite(body.y) ? Math.max(0, Math.min(WORLD_HEIGHT, body.y)) : null
      if (x === null || y === null) return NextResponse.json({ error: 'Food coordinates are invalid.' }, { status: 400 })
      const world: WorldSnapshot = {
        ...current,
        food: [...current.food, { id: `food-${Date.now()}`, x, y, age: 0 }],
        events: [{ id: Date.now(), kind: 'feed', title: 'Food placed', detail: 'A visitor changed the ecosystem', time: 'now', color: 'amber' } as WorldEvent, ...current.events].slice(0, 8),
      }
      await persistHotWorld(world)
      return NextResponse.json(world)
    }
    const passwordHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body.password ?? ''))
    const suppliedHash = Array.from(new Uint8Array(passwordHash)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
    if (suppliedHash !== ADMIN_PASSWORD_HASH) return NextResponse.json({ error: 'Only the god account can change the world.' }, { status: 401 })

    const shouldRestart = body.action === 'restart'
    const initial = shouldRestart ? createInitialSnapshot() : null
    const world: WorldSnapshot = {
      ...(initial ?? current),
      status: 'running',
      startedAt: Date.now(),
    }
    await persistHotWorld(world, true)
    return NextResponse.json(world)
  } catch {
    return NextResponse.json({ error: 'Unable to update the Petri world.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as Partial<WorldSnapshot> & { durable?: boolean }
    const current = await getOrCreateWorld()
    const world: WorldSnapshot = {
      ...current,
      ...(body.creatures ? { creatures: body.creatures } : {}),
      ...(body.food ? { food: body.food } : {}),
      ...(body.events ? { events: body.events } : {}),
      ...(typeof body.births === 'number' ? { births: body.births } : {}),
      ...(typeof body.deaths === 'number' ? { deaths: body.deaths } : {}),
      ...(typeof body.generation === 'number' ? { generation: body.generation } : {}),
    }
    await persistHotWorld(world, body.durable === true)
    return NextResponse.json(world)
  } catch {
    return NextResponse.json({ error: 'Unable to save the Petri world.' }, { status: 500 })
  }
}
