# Petri — A living world

Petri is an always-on ecosystem simulation built with Next.js. The server owns creature movement, food, reproduction, aging, starvation, lifecycle events, and population state; the browser renders authoritative snapshots over WebSocket.

## Routes

- `/` — editorial introduction and entry point
- `/playground` — live interactive world; click to place food, drag to pan, and use the wheel to zoom
- `/api/health` — health check
- `/api/petri` — persistence and simulation API fallback

## Development

```bash
pnpm install
pnpm dev
```

The Next.js preview runs on port 3000. The production server entrypoint is `server.ts`, which preserves the WebSocket and persistence runtime used by the playground.

## Verification

```bash
pnpm run test:simulation
pnpm exec tsc --noEmit
pnpm run build
pnpm run build:server
```

The visual landing page is presentation-only. It does not create creatures, mutate food, or replace the authoritative simulation.
