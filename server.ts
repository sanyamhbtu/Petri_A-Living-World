import { createServer } from 'node:http'
import next from 'next'
import { WebSocketServer, type WebSocket } from 'ws'
import { eq } from 'drizzle-orm'
import { createInitialSnapshot, tickWorld, addFood, mutateCreature } from './components/petri/simulation'
import { WORLD_HEIGHT, WORLD_WIDTH } from './components/petri/types'
import type { Creature, Food, WorldSnapshot } from './components/petri/types'
import { db } from './lib/db'
import { petriWorld } from './lib/db/schema'
import { redis, PETRI_CACHE_KEY, PETRI_SNAPSHOT_KEY } from './lib/redis'

const port = Number(process.env.PORT ?? 3000)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const ADMIN_PASSWORD_HASH = '80585c5c69ad3b293a62fdee09f5ab7f2f8cb6f2078eb1cf7c96da89f8e26235'
const TICK_MS = 50
const BROADCAST_MS = 100
const SNAPSHOT_MS = 15_000
const MAX_COMMANDS_PER_WINDOW = 24
const clients = new Set<WebSocket>()
let world: WorldSnapshot = createInitialSnapshot()
let loaded = false
let revision = 0
let lastSnapshotAt = 0
let lastBroadcastAt = 0
let commandQueue = Promise.resolve()

type ClientState = { windowStartedAt: number; commands: number }
type ClientMessage = { type?: string; x?: number; y?: number; action?: string; password?: string }
type WorldPatch = { type: 'patch'; revision: number; creatures: Creature[]; food: Food[]; events: WorldSnapshot['events']; births: number; deaths: number; generation: number; startedAt: number; status: WorldSnapshot['status'] }

function nowWorld(snapshot: WorldSnapshot) { return { ...snapshot, updatedAt: Date.now() } }
function safeCoordinate(value: unknown, max: number) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : null }

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
  if (now - lastSnapshotAt < SNAPSHOT_MS) return
  lastSnapshotAt = now
  try {
    await db.update(petriWorld).set({ status: world.status, startedAt: world.startedAt ? new Date(world.startedAt) : null, creatures: world.creatures, food: world.food, events: world.events, births: world.births, deaths: world.deaths, generation: world.generation, updatedAt: new Date() }).where(eq(petriWorld.id, 1))
    if (redis) { await redis.set(PETRI_CACHE_KEY, nowWorld(world)); await redis.set(PETRI_SNAPSHOT_KEY, now) }
  } catch (error) {
    console.warn('[petri] snapshot deferred; realtime world remains authoritative', error)
  }
}

function broadcastSnapshot() {
  const payload = JSON.stringify({ type: 'snapshot', revision, world })
  for (const client of clients) if (client.readyState === 1) client.send(payload)
}

function broadcastPatch(force = false) {
  const now = Date.now()
  if (!force && now - lastBroadcastAt < BROADCAST_MS) return
  lastBroadcastAt = now
  const patch: WorldPatch = { type: 'patch', revision, creatures: world.creatures, food: world.food, events: world.events, births: world.births, deaths: world.deaths, generation: world.generation, startedAt: world.startedAt, status: world.status }
  const payload = JSON.stringify(patch)
  for (const client of clients) if (client.readyState === 1 && client.bufferedAmount < 512_000) client.send(payload)
}

async function verify(password: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return hash === ADMIN_PASSWORD_HASH
}

function enqueue(task: () => Promise<void>) {
  commandQueue = commandQueue.then(task).catch((error) => console.warn('[petri] command failed', error))
  return commandQueue
}

app.prepare().then(async () => {
  await loadWorld()
  const httpServer = createServer((request, response) => handle(request, response))
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 })
  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url !== '/ws') { socket.destroy(); return }
    wss.handleUpgrade(request, socket, head, (client) => wss.emit('connection', client, request))
  })
  wss.on('connection', (client) => {
    clients.add(client)
    const state: ClientState = { windowStartedAt: Date.now(), commands: 0 }
    client.send(JSON.stringify({ type: 'snapshot', revision, world }))
    client.on('pong', () => { ;(client as WebSocket & { isAlive?: boolean }).isAlive = true })
    client.on('message', (raw) => {
      const now = Date.now()
      if (now - state.windowStartedAt > 1000) { state.windowStartedAt = now; state.commands = 0 }
      if (++state.commands > MAX_COMMANDS_PER_WINDOW) { client.send(JSON.stringify({ type: 'error', message: 'Too many realtime commands.' })); return }
      let message: ClientMessage
      try { message = JSON.parse(raw.toString()) as ClientMessage } catch { client.send(JSON.stringify({ type: 'error', message: 'Invalid realtime command.' })); return }
      void enqueue(async () => {
        if (message.type === 'feed') {
          const x = safeCoordinate(message.x, WORLD_WIDTH); const y = safeCoordinate(message.y, WORLD_HEIGHT)
          if (x === null || y === null) { client.send(JSON.stringify({ type: 'error', message: 'Food coordinates are invalid.' })); return }
          world = addFood(world, x, y); revision += 1
          if (redis) await redis.lpush('petri:events:v1', { type: 'feed', x, y, at: Date.now() })
          broadcastPatch(true); return
        }
        if (message.type === 'mutate' && world.status === 'running') { world = mutateCreature(world); revision += 1; broadcastPatch(true); return }
        if (message.type === 'admin' && (message.action === 'start' || message.action === 'restart')) {
          if (!(await verify(message.password ?? ''))) { client.send(JSON.stringify({ type: 'error', message: 'Only the god account can change the world.' })); return }
          world = message.action === 'restart' ? createInitialSnapshot() : world
          world.status = 'running'; world.startedAt = Date.now(); revision += 1
          await snapshot(); broadcastSnapshot()
        }
      })
    })
    client.on('error', (error) => console.warn('[petri] websocket error', error.message))
    client.on('close', () => clients.delete(client))
  })
  const heartbeat = setInterval(() => {
    for (const client of clients) {
      const tracked = client as WebSocket & { isAlive?: boolean }
      if (tracked.isAlive === false) { client.terminate(); clients.delete(client); continue }
      tracked.isAlive = false; client.ping()
    }
  }, 30_000)
  setInterval(() => {
    if (world.status === 'running') { world = tickWorld(world, TICK_MS); revision += 1; broadcastPatch(); void snapshot() }
  }, TICK_MS)
  const host = process.env.HOST ?? '0.0.0.0'
  httpServer.listen(port, host, () => console.log(`[petri] Next + WebSocket server listening on ${host}:${port}`))
  const shutdown = () => { clearInterval(heartbeat); httpServer.close(() => process.exit(0)) }
  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
})
