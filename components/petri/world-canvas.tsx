'use client'

import { useEffect, useRef } from 'react'
import type { Creature, Food } from './types'

type WorldCanvasProps = { creatures: Creature[]; food: Food[]; onFeed: (x: number, y: number) => void }
const TILE = 32
const WORLD_WIDTH = 1800
const WORLD_HEIGHT = 1100
function seededNoise(x: number, y: number) { const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return value - Math.floor(value) }
function drawCreature(context: CanvasRenderingContext2D, creature: Creature) { const bob = Math.sin(creature.pulse) * 2; const size = 10 * creature.scale; const color = `hsl(${creature.hue}, 58%, 62%)`; context.save(); context.translate(creature.x, creature.y + bob); context.rotate(creature.angle); context.shadowColor = color; context.shadowBlur = 14; context.fillStyle = color; context.beginPath(); context.arc(0, 0, size, 0, Math.PI * 2); context.fill(); context.shadowBlur = 0; context.fillStyle = 'rgba(255,255,255,0.8)'; context.fillRect(size * 0.25, -size * 0.45, 2, 2); context.fillRect(size * 0.25, size * 0.2, 2, 2); context.fillStyle = 'rgba(13, 27, 25, 0.9)'; context.fillRect(size * 0.35, -size * 0.45, 2, 2); context.fillRect(size * 0.35, size * 0.2, 2, 2); context.restore() }
function drawTerrain(context: CanvasRenderingContext2D, width: number, height: number, offsetX: number, offsetY: number, zoom: number) { context.fillStyle = '#13211d'; context.fillRect(0, 0, width, height); context.save(); context.translate(offsetX, offsetY); context.scale(zoom, zoom); const startX = Math.max(0, Math.floor(-offsetX / zoom / TILE) - 1); const startY = Math.max(0, Math.floor(-offsetY / zoom / TILE) - 1); const endX = Math.min(Math.ceil(WORLD_WIDTH / TILE), Math.ceil((width - offsetX) / zoom / TILE) + 2); const endY = Math.min(Math.ceil(WORLD_HEIGHT / TILE), Math.ceil((height - offsetY) / zoom / TILE) + 2); for (let x = startX; x < endX; x += 1) for (let y = startY; y < endY; y += 1) { const noise = seededNoise(x * 0.7, y * 0.7); context.fillStyle = noise > 0.73 ? '#1c3029' : noise < 0.2 ? '#172823' : '#14251f'; context.fillRect(x * TILE, y * TILE, TILE + 1, TILE + 1); if (noise > 0.7) { context.fillStyle = 'rgba(97, 133, 93, 0.12)'; context.fillRect(x * TILE + 6, y * TILE + 8, 2, 2); context.fillRect(x * TILE + 19, y * TILE + 21, 2, 2) } } context.restore() }

export function WorldCanvas({ creatures, food, onFeed }: WorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const creaturesRef = useRef(creatures); const foodRef = useRef(food); const onFeedRef = useRef(onFeed)
  const viewRef = useRef({ x: 0, y: 0, zoom: 0 })
  const dragRef = useRef({ active: false, moved: false, x: 0, y: 0 })
  creaturesRef.current = creatures; foodRef.current = food; onFeedRef.current = onFeed

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const context = canvas.getContext('2d'); if (!context) return
    let frame = 0
    const resize = () => { const ratio = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.floor(canvas.clientWidth * ratio); canvas.height = Math.floor(canvas.clientHeight * ratio); context.setTransform(ratio, 0, 0, ratio, 0, 0); const fit = Math.min(canvas.clientWidth / WORLD_WIDTH, canvas.clientHeight / WORLD_HEIGHT) * 0.94; const nextZoom = Math.max(0.24, Math.min(1.35, fit)); if (!viewRef.current.zoom || viewRef.current.zoom < 0.3) viewRef.current.zoom = nextZoom; viewRef.current.x = Math.min(0, Math.max(canvas.clientWidth - WORLD_WIDTH * viewRef.current.zoom, viewRef.current.x)); viewRef.current.y = Math.min(0, Math.max(canvas.clientHeight - WORLD_HEIGHT * viewRef.current.zoom, viewRef.current.y)); if (viewRef.current.x === 0 && viewRef.current.y === 0) { viewRef.current.x = (canvas.clientWidth - WORLD_WIDTH * viewRef.current.zoom) / 2; viewRef.current.y = (canvas.clientHeight - WORLD_HEIGHT * viewRef.current.zoom) / 2 } }
    const render = () => { const { x, y, zoom } = viewRef.current; drawTerrain(context, canvas.clientWidth, canvas.clientHeight, x, y, zoom); context.save(); context.translate(x, y); context.scale(zoom, zoom); foodRef.current.forEach((item) => { const pulse = Math.sin(item.age * 0.004) * 2; context.fillStyle = 'rgba(215, 166, 78, 0.18)'; context.beginPath(); context.arc(item.x, item.y, 14 + pulse, 0, Math.PI * 2); context.fill(); context.fillStyle = '#d7a64e'; context.fillRect(item.x - 5, item.y - 5, 10, 10) }); creaturesRef.current.forEach((creature) => drawCreature(context, creature)); context.restore(); frame = requestAnimationFrame(render) }
    resize(); const observer = new ResizeObserver(resize); observer.observe(canvas); frame = requestAnimationFrame(render); return () => { cancelAnimationFrame(frame); observer.disconnect() }
  }, [])

  const pointToWorld = (event: { currentTarget: HTMLCanvasElement; clientX: number; clientY: number }) => { const rect = event.currentTarget.getBoundingClientRect(); const { x, y, zoom } = viewRef.current; return { x: (event.clientX - rect.left - x) / zoom, y: (event.clientY - rect.top - y) / zoom } }
  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => { if (event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { active: true, moved: false, x: event.clientX, y: event.clientY } }
  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => { const drag = dragRef.current; if (!drag.active) return; const dx = event.clientX - drag.x; const dy = event.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true; viewRef.current.x += dx; viewRef.current.y += dy; drag.x = event.clientX; drag.y = event.clientY }
  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => { const drag = dragRef.current; drag.active = false; if (!drag.moved) { const point = pointToWorld(event); onFeedRef.current(point.x, point.y) } }
  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => { event.preventDefault(); const point = pointToWorld(event); const nextZoom = Math.max(0.24, Math.min(1.8, viewRef.current.zoom * (event.deltaY > 0 ? 0.9 : 1.1))); viewRef.current.x = event.nativeEvent.offsetX - point.x * nextZoom; viewRef.current.y = event.nativeEvent.offsetY - point.y * nextZoom; viewRef.current.zoom = nextZoom }
  return <canvas ref={canvasRef} className="petri-canvas" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={() => { dragRef.current.active = false }} onWheel={handleWheel} aria-label="Live Petri ecosystem. Click to place food, drag to pan, and scroll to zoom." role="img" />
}
