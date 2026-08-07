"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = require("node:http");
const next_1 = __importDefault(require("next"));
const ws_1 = require("ws");
const drizzle_orm_1 = require("drizzle-orm");
const simulation_1 = require("./components/petri/simulation");
const db_1 = require("./lib/db");
const schema_1 = require("./lib/db/schema");
const redis_1 = require("./lib/redis");
const port = Number(process.env.PORT ?? 3000);
const dev = process.env.NODE_ENV !== 'production';
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
const ADMIN_PASSWORD_HASH = '80585c5c69ad3b293a62fdee09f5ab7f2f8cb6f2078eb1cf7c96da89f8e26235';
const WORLD_WIDTH = 1800;
const WORLD_HEIGHT = 1100;
const TICK_MS = 50;
const BROADCAST_MS = 100;
const SNAPSHOT_MS = 15_000;
const MAX_COMMANDS_PER_WINDOW = 24;
const clients = new Set();
let world = (0, simulation_1.createInitialSnapshot)();
let loaded = false;
let revision = 0;
let lastSnapshotAt = 0;
let lastBroadcastAt = 0;
let commandQueue = Promise.resolve();
function nowWorld(snapshot) { return { ...snapshot, updatedAt: Date.now() }; }
function safeCoordinate(value, max) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : null; }
async function loadWorld() {
    if (loaded)
        return;
    try {
        const cached = redis_1.redis ? await redis_1.redis.get(redis_1.PETRI_CACHE_KEY) : null;
        if (cached)
            world = cached;
        else {
            const row = (await db_1.db.select().from(schema_1.petriWorld).where((0, drizzle_orm_1.eq)(schema_1.petriWorld.id, 1)).limit(1))[0];
            if (row)
                world = { creatures: row.creatures, food: row.food, events: row.events, births: row.births, deaths: row.deaths, generation: row.generation, status: row.status, startedAt: row.startedAt?.getTime() ?? 0 };
            else {
                const initial = (0, simulation_1.createInitialSnapshot)();
                await db_1.db.insert(schema_1.petriWorld).values({ id: 1, status: 'stopped', creatures: initial.creatures, food: initial.food, events: initial.events, births: 0, deaths: 0, generation: 1 });
                world = initial;
            }
            if (redis_1.redis)
                await redis_1.redis.set(redis_1.PETRI_CACHE_KEY, nowWorld(world));
        }
    }
    catch (error) {
        console.warn('[petri] persistence unavailable; continuing with in-memory world', error);
        world = (0, simulation_1.createInitialSnapshot)();
    }
    finally {
        loaded = true;
    }
}
async function snapshot() {
    const now = Date.now();
    if (now - lastSnapshotAt < SNAPSHOT_MS)
        return;
    lastSnapshotAt = now;
    try {
        await db_1.db.update(schema_1.petriWorld).set({ status: world.status, startedAt: world.startedAt ? new Date(world.startedAt) : null, creatures: world.creatures, food: world.food, events: world.events, births: world.births, deaths: world.deaths, generation: world.generation, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.petriWorld.id, 1));
        if (redis_1.redis) {
            await redis_1.redis.set(redis_1.PETRI_CACHE_KEY, nowWorld(world));
            await redis_1.redis.set(redis_1.PETRI_SNAPSHOT_KEY, now);
        }
    }
    catch (error) {
        console.warn('[petri] snapshot deferred; realtime world remains authoritative', error);
    }
}
function broadcastSnapshot() {
    const payload = JSON.stringify({ type: 'snapshot', revision, world });
    for (const client of clients)
        if (client.readyState === 1)
            client.send(payload);
}
function broadcastPatch(force = false) {
    const now = Date.now();
    if (!force && now - lastBroadcastAt < BROADCAST_MS)
        return;
    lastBroadcastAt = now;
    const patch = { type: 'patch', revision, creatures: world.creatures, food: world.food, events: world.events, births: world.births, deaths: world.deaths, generation: world.generation, startedAt: world.startedAt, status: world.status };
    const payload = JSON.stringify(patch);
    for (const client of clients)
        if (client.readyState === 1 && client.bufferedAmount < 512_000)
            client.send(payload);
}
async function verify(password) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return hash === ADMIN_PASSWORD_HASH;
}
function enqueue(task) {
    commandQueue = commandQueue.then(task).catch((error) => console.warn('[petri] command failed', error));
    return commandQueue;
}
app.prepare().then(async () => {
    await loadWorld();
    const httpServer = (0, node_http_1.createServer)((request, response) => handle(request, response));
    const wss = new ws_1.WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });
    httpServer.on('upgrade', (request, socket, head) => {
        if (request.url !== '/ws') {
            socket.destroy();
            return;
        }
        wss.handleUpgrade(request, socket, head, (client) => wss.emit('connection', client, request));
    });
    wss.on('connection', (client) => {
        clients.add(client);
        const state = { windowStartedAt: Date.now(), commands: 0 };
        client.send(JSON.stringify({ type: 'snapshot', revision, world }));
        client.on('pong', () => { ; client.isAlive = true; });
        client.on('message', (raw) => {
            const now = Date.now();
            if (now - state.windowStartedAt > 1000) {
                state.windowStartedAt = now;
                state.commands = 0;
            }
            if (++state.commands > MAX_COMMANDS_PER_WINDOW) {
                client.send(JSON.stringify({ type: 'error', message: 'Too many realtime commands.' }));
                return;
            }
            let message;
            try {
                message = JSON.parse(raw.toString());
            }
            catch {
                client.send(JSON.stringify({ type: 'error', message: 'Invalid realtime command.' }));
                return;
            }
            void enqueue(async () => {
                if (message.type === 'feed') {
                    const x = safeCoordinate(message.x, WORLD_WIDTH);
                    const y = safeCoordinate(message.y, WORLD_HEIGHT);
                    if (x === null || y === null) {
                        client.send(JSON.stringify({ type: 'error', message: 'Food coordinates are invalid.' }));
                        return;
                    }
                    world = (0, simulation_1.addFood)(world, x, y);
                    revision += 1;
                    if (redis_1.redis)
                        await redis_1.redis.lpush('petri:events:v1', { type: 'feed', x, y, at: Date.now() });
                    broadcastPatch(true);
                    return;
                }
                if (message.type === 'mutate' && world.status === 'running') {
                    world = (0, simulation_1.mutateCreature)(world);
                    revision += 1;
                    broadcastPatch(true);
                    return;
                }
                if (message.type === 'admin' && (message.action === 'start' || message.action === 'restart')) {
                    if (!(await verify(message.password ?? ''))) {
                        client.send(JSON.stringify({ type: 'error', message: 'Only the god account can change the world.' }));
                        return;
                    }
                    world = message.action === 'restart' ? (0, simulation_1.createInitialSnapshot)() : world;
                    world.status = 'running';
                    world.startedAt = Date.now();
                    revision += 1;
                    await snapshot();
                    broadcastSnapshot();
                }
            });
        });
        client.on('error', (error) => console.warn('[petri] websocket error', error.message));
        client.on('close', () => clients.delete(client));
    });
    const heartbeat = setInterval(() => {
        for (const client of clients) {
            const tracked = client;
            if (tracked.isAlive === false) {
                client.terminate();
                clients.delete(client);
                continue;
            }
            tracked.isAlive = false;
            client.ping();
        }
    }, 30_000);
    setInterval(() => {
        if (world.status === 'running') {
            world = (0, simulation_1.tickWorld)(world, TICK_MS);
            revision += 1;
            broadcastPatch();
            void snapshot();
        }
    }, TICK_MS);
    const host = process.env.HOST ?? '0.0.0.0';
    httpServer.listen(port, host, () => console.log(`[petri] Next + WebSocket server listening on ${host}:${port}`));
    const shutdown = () => { clearInterval(heartbeat); httpServer.close(() => process.exit(0)); };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
});
