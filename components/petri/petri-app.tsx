'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, CircleHelp, Crosshair, Dna, KeyRound, Leaf, LockKeyhole, Radio, Sparkles, TriangleAlert, X } from 'lucide-react'
import { addFood, createInitialSnapshot, mutateCreature } from './simulation'
import { WORLD_HEIGHT, WORLD_WIDTH } from './types'
import type { WorldSnapshot } from './types'
import { WorldCanvas } from './world-canvas'

function formatUptime(startedAt: number) {
  if (!startedAt) return '0 sec'
  const totalSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return hours ? `${hours}h ${String(minutes).padStart(2, '0')}m` : minutes ? `${minutes}m ${String(seconds).padStart(2, '0')}s` : `${seconds} sec`
}

export function PetriApp() {
  const [world, setWorld] = useState<WorldSnapshot>(() => createInitialSnapshot())
  const [uptime, setUptime] = useState('0 sec')
  const [panelOpen, setPanelOpen] = useState(true)
  const [adminOpen, setAdminOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [adminError, setAdminError] = useState('')
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState('')
  const socketRef = useRef<WebSocket | null>(null)
  const revisionRef = useRef(0)
  const pendingAdminRef = useRef(false)

  useEffect(() => {
    fetch('/api/petri').then(async (response) => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setWorld(data as WorldSnapshot)
    }).catch((error: Error) => setConnectionError(error.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => setUptime(formatUptime(world.startedAt)), 1000)
    return () => window.clearInterval(interval)
  }, [world.startedAt])

  useEffect(() => {
    let reconnectTimer = 0
    let disposed = false
    const connect = () => {
      if (disposed) return
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const socket = new WebSocket(`${protocol}//${window.location.host}/ws`)
      socketRef.current = socket
      socket.onopen = () => setConnectionError('')
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data) as {
          type?: string
          revision?: number
          world?: WorldSnapshot
          creatures?: WorldSnapshot['creatures']
          food?: WorldSnapshot['food']
          events?: WorldSnapshot['events']
          births?: number
          deaths?: number
          generation?: number
          startedAt?: number
          status?: WorldSnapshot['status']
          message?: string
        }
        if (message.type === 'snapshot' && message.world) {
          revisionRef.current = message.revision ?? revisionRef.current
          setWorld(message.world)
          if (pendingAdminRef.current) { pendingAdminRef.current = false; setPassword(''); setAdminOpen(false) }
        }
        if (message.type === 'patch' && message.creatures && message.food) {
          const nextRevision = message.revision ?? revisionRef.current + 1
          revisionRef.current = Math.max(revisionRef.current, nextRevision)
          setWorld((current) => ({
            ...current,
            creatures: message.creatures!,
            food: message.food!,
            events: message.events ?? current.events,
            births: message.births ?? current.births,
            deaths: message.deaths ?? current.deaths,
            generation: message.generation ?? current.generation,
            startedAt: message.startedAt ?? current.startedAt,
            status: message.status ?? current.status,
          }))
          if (pendingAdminRef.current) { pendingAdminRef.current = false; setPassword(''); setAdminOpen(false) }
        }
        if (message.type === 'error') setAdminError(message.message ?? 'Realtime command failed.')
      }
      socket.onerror = () => setConnectionError('Realtime socket unavailable; using fallback sync.')
      socket.onclose = () => { socketRef.current = null; if (!disposed) reconnectTimer = window.setTimeout(connect, 2000) }
    }
    connect()
    return () => { disposed = true; window.clearTimeout(reconnectTimer); socketRef.current?.close() }
  }, [])

  const generations = useMemo(() => Math.max(...world.creatures.map((creature) => creature.generation), 1), [world.creatures])
  const isRunning = world.status === 'running'

  async function submitAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAdminError('')
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      pendingAdminRef.current = true
      socketRef.current.send(JSON.stringify({ type: 'admin', action: isRunning ? 'restart' : 'start', password }))
      return
    }
    const response = await fetch('/api/petri', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: isRunning ? 'restart' : 'start', password }) })
    const data = await response.json()
    if (!response.ok) { setAdminError(data.error ?? 'That password is not accepted.'); return }
    setWorld(data as WorldSnapshot); setPassword(''); setAdminOpen(false)
  }

  function handleFeed(x: number, y: number) {
    const safeX = Math.max(0, Math.min(WORLD_WIDTH, x))
    const safeY = Math.max(0, Math.min(WORLD_HEIGHT, y))
    const next = addFood(world, safeX, safeY)
    setWorld(next)
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: 'feed', x: safeX, y: safeY }))
    else void fetch('/api/petri', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'feed', x: safeX, y: safeY }) })
  }

  return (
    <main className="petri-shell">
      <div className="world-stage">
        <WorldCanvas creatures={world.creatures} food={world.food} onFeed={handleFeed} />
        <div className="vignette" aria-hidden="true" />
        <header className="brand-lockup"><div className="brand-mark"><Leaf size={18} strokeWidth={2.5} /></div><div><div className="brand-name">petri</div><div className="brand-subtitle">A living world</div></div><div className={`live-pill ${isRunning ? '' : 'is-paused'}`}><span className="live-dot" /> {isRunning ? 'LIVE' : 'WAITING'}</div></header>
        <section className="world-stats" aria-label="World statistics"><div><span>ALIVE FOR</span><strong>{loading ? 'loading' : uptime}</strong></div><div><span>POPULATION</span><strong>{world.creatures.length}</strong></div><div><span>GENERATIONS</span><strong>{generations}</strong></div><div><span>BIRTHS</span><strong className="stat-mint">{world.births}</strong></div><div><span>DEATHS</span><strong className="stat-coral">{world.deaths}</strong></div></section>
        <div className="canvas-hint"><Crosshair size={14} /> {isRunning ? 'Click to place food · drag to pan · wheel to zoom' : 'The world is paused'}</div>
        <div className="world-coordinates">EARTH FIELD · 35° 12&apos; N · 118° 14&apos; W</div>
        <button className="god-button" onClick={() => { setAdminError(''); setAdminOpen(true) }}><LockKeyhole size={14} /> {isRunning ? 'DO NOT CLICK · RESTART' : 'GOD CONTROL · START'}</button>
        <button className="help-button" aria-label="About Petri"><CircleHelp size={17} /></button>
        {connectionError && <div className="connection-error"><TriangleAlert size={14} /> {connectionError}</div>}
        <aside className={`event-panel ${panelOpen ? '' : 'is-collapsed'}`}><button className="panel-toggle" onClick={() => setPanelOpen((open) => !open)} aria-label={panelOpen ? 'Collapse event log' : 'Expand event log'}><ChevronRight size={16} className={panelOpen ? 'rotate-180' : ''} /></button><div className="panel-content"><div className="panel-heading"><span>FIELD NOTES</span><span className="panel-live"><Radio size={12} /> WEBSOCKET LIVE</span></div><div className="events-list">{world.events.map((event) => <div className="event-row" key={event.id}><div className={`event-icon event-${event.color}`}>{event.kind === 'birth' ? <Sparkles size={13} /> : event.kind === 'mutation' ? <Dna size={13} /> : <Leaf size={13} />}</div><div className="event-copy"><strong>{event.title}</strong><span>{event.detail}</span></div><time>{event.time}</time></div>)}</div><button className="mutation-button" onClick={() => { if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: 'mutate' })); else setWorld((current) => mutateCreature(current)) }}><Dna size={15} /> Trigger mutation</button></div></aside>
        <footer className="world-footer"><span>ONE SHARED WORLD · WEBSOCKET LIVE · POSTGRES SNAPSHOT</span><span>ADMIN CONTROLLED</span></footer>
      </div>
      {adminOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setAdminOpen(false) }}><section className="god-modal" role="dialog" aria-modal="true" aria-labelledby="god-title"><button className="modal-close" onClick={() => setAdminOpen(false)} aria-label="Close admin dialog"><X size={16} /></button><div className="modal-icon"><KeyRound size={20} /></div><p className="eyebrow">PRIVATE CONTROL SURFACE</p><h1 id="god-title">{isRunning ? 'Reset the world?' : 'Start the world'}</h1><p className="warning-copy"><TriangleAlert size={15} /> {isRunning ? 'Why not listen? This step can reset the world. All creatures will be replaced with exactly three new starters.' : 'The timer will begin at 0 sec. Only the god account can start or reset this world.'}</p><form onSubmit={submitAdmin}><label htmlFor="god-password">Admin password</label><input id="god-password" autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter the god proof" required />{adminError && <p className="admin-error">{adminError}</p>}<button className="confirm-god" type="submit">{isRunning ? 'Yes, reset the world' : 'Start at 0 sec'}</button></form></section></div>}
    </main>
  )
}
