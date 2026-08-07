import { createServer } from 'node:http'
import next from 'next'
import { WebSocketServer, type WebSocket } from 'ws'
import { eq } from 'drizzle-orm'
import { createInitialSnapshot, tickWorld, addFood, mutateCreature } from './components/petri/simulation'
import type { WorldSnapshot } from './components/petri/types'
import { db } from './lib/db'
import { petriWorld } from './lib/db/schema'
import { redis, PETRI_CACHE_KEY, PETRI_SNAPSHOT_KEY } from './lib/redis'

const port = Number(process.env.PORT ?? 3000)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const ADMIN_PASSWORD_HASH = '80585c5c69ad3b293a62fdee09f5ab7f2f8cb6f2078eb1cf7c96da89f8e26235'
const clients = new Set<WebSocket>()
let world: WorldSnapshot = createInitialSnapshot()
let loaded = false
let lastSnapshotAt = 0

function nowWorld(snapshot: WorldSnapshot) { return { ...snapshot, updatedAt: Date.now() } }
async function loadWorld() {
  if (loaded) return
  try {
    const cached = redis ? await redis.get<(WorldSnapshot & { updatedAt?: number })>(PETRI_CACHE_KEY) : null
    if (cached) world = cached
    else {
      const row = (await db.select().from(petriWorld).where(eq(petriWorld.id, 1)).limit(1))[0]
      if (row) world = { creatures: row.creatures as WorldSnapshot['creatures'], food: row.food as WorldSnapshot['food'], events: row.events as WorldSnapshot['events'], births: row.births, deaths: row.deaths, generation: row.generation, status: row.status as WorldSnapshot['status'], startedAt: row.startedAt?.getTime() ?? 0 }
      else {
        const initial = createInitialSnapshot()
        await db.insert(petriWorld).values({ id: 1, status: 'stopped', creatures: initial.creatures, food: initial.food, events: initial.events, births: 0, deaths: 0, generation: 1 })
        world = initial
      }
      if (redis) await redis.set(PETRI_CACHE_KEY, nowWorld(world))
    }
  } catch (error) {
    console.warn('[petri] persistence unavailable; continuing with in-memory world', error)
    world = createInitialSnapshot()
  } finally {
    loaded = true
  }
}
async function snapshot() {
  const now = Date.now()
  if (now - lastSnapshotAt < 15000) return
  lastSnapshotAt = now
  try {
    await db.update(petriWorld).set({ status: world.status, startedAt: world.startedAt ? new Date(world.startedAt) : null, creatures: world.creatures, food: world.food, events: world.events, births: world.births, deaths: world.deaths, generation: world.generation, updatedAt: new Date() }).where(eq(petriWorld.id, 1))
    if (redis) { await redis.set(PETRI_CACHE_KEY, nowWorld(world)); await redis.set(PETRI_SNAPSHOT_KEY, now) }
  } catch (error) {
    console.warn('[petri] snapshot deferred; realtime world remains authoritative', error)
  }
}
function broadcast() { const payload = JSON.stringify({ type: 'snapshot', world }); for (const client of clients) if (client.readyState === 1) client.send(payload) }
async function verify(password: string) { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)); const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join(''); return hash === ADMIN_PASSWORD_HASH }

app.prepare().then(async () => {
  await loadWorld()
  const httpServer = createServer((request, response) => handle(request, response))
  const wss = new WebSocketServer({ noServer: true })
  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url !== '/ws') { socket.destroy(); return }
    wss.handleUpgrade(request, socket, head, (client) => wss.emit('connection', client, request))
  })
  wss.on('connection', (client) => {
    clients.add(client)
    client.send(JSON.stringify({ type: 'snapshot', world }))
    client.on('message', async (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as { type?: string; x?: number; y?: number; action?: string; password?: string }
        if (message.type === 'feed' && Number.isFinite(message.x) && Number.isFinite(message.y)) {
          const safeX = Math.max(0, Math.min(1800, message.x!))
          const safeY = Math.max(0, Math.min(1100, message.y!))
          world = addFood(world, safeX, safeY)
          if (redis) await redis.lpush('petri:events:v1', { type: 'feed', x: safeX, y: safeY, at: Date.now() })
          broadcast()
        }
        if (message.type === 'mutate' && world.status === 'running') {
          world = mutateCreature(world)
          broadcast()
        }
        if (message.type === 'admin' && (message.action === 'start' || message.action === 'restart') && await verify(message.password ?? '')) {
          world = message.action === 'restart' ? createInitialSnapshot() : world
          world.status = 'running'; world.startedAt = Date.now();
          await snapshot(); broadcast()
        }
      } catch { client.send(JSON.stringify({ type: 'error', message: 'Invalid realtime command.' })) }
    })
    client.on('close', () => clients.delete(client))
  })
  setInterval(() => {
    if (world.status === 'running') { world = tickWorld(world, 50); broadcast(); void snapshot() }
  }, 50)
  httpServer.listen(port, () => console.log(`[petri] Next + WebSocket server listening on ${port}`))
})
