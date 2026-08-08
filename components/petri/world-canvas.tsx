'use client'

import { useEffect, useRef } from 'react'
import type { Creature, Food } from './types'
import { STARTING_SECTOR, WORLD_HEIGHT, WORLD_WIDTH } from './types'

type WorldCanvasProps = { creatures: Creature[]; food: Food[]; onFeed: (x: number, y: number) => void }

const TILE = 20
const TAU = Math.PI * 2
// Water moat + sandy shoreline sit inside the world bounds. Simulation coords are unchanged.
const WATER_BAND = 240
const SHORE_BAND = 90

// Earthy, cohesive meadow palette (grass, soil, sand, water, forest).
const GRASS = ['#4c7c34', '#53853a', '#5a8d40', '#487830']
const SOIL = ['#7a5731', '#856439', '#6d4f2c']
const SAND = '#c9b276'
const SAND_DARK = '#b39a5f'
const WATER_DEEP = '#17607a'
const WATER_MID = '#1d7c96'
const WATER_FOAM = '#57b4c4'
const OUT_OF_BOUNDS = '#20242b'

function seededNoise(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function tileColor(tx: number, ty: number) {
  // Colour is decided per 2x2 cell so the meadow reads as calm blocks, not static.
  const cx = Math.floor(tx / 2)
  const cy = Math.floor(ty / 2)
  const patch = seededNoise(Math.floor(cx / 4) * 0.37, Math.floor(cy / 4) * 0.29)
  const shade = seededNoise(cx * 0.61, cy * 0.53)
  if (patch > 0.88) return SOIL[Math.floor(shade * SOIL.length) % SOIL.length]
  return GRASS[Math.floor(shade * GRASS.length) % GRASS.length]
}

function drawWater(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, time: number) {
  context.fillStyle = WATER_DEEP
  context.fillRect(x, y, width, height)
  context.fillStyle = WATER_MID
  for (let row = y + 8; row < y + height; row += 22) {
    const drift = Math.sin(time * 0.0012 + row * 0.05) * 10
    for (let col = x + ((Math.floor(row / 22) % 2) * 14) + drift; col < x + width; col += 40) context.fillRect(col, row, 18, 5)
  }
  context.fillStyle = WATER_FOAM
  for (let row = y + 16; row < y + height; row += 46) {
    const drift = Math.cos(time * 0.0016 + row * 0.04) * 12
    for (let col = x + drift; col < x + width; col += 78) context.fillRect(col, row, 8, 3)
  }
}

function drawBush(context: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  const canopy = variant % 3 === 0 ? '#3c6b31' : variant % 3 === 1 ? '#48803a' : '#54924a'
  const trunk = '#5a3f28'
  context.fillStyle = trunk
  context.fillRect(x - 4, y + 8, 8, 16)
  context.fillStyle = '#1f3b26'
  context.fillRect(x - 18, y - 12, 36, 24)
  context.fillStyle = canopy
  context.fillRect(x - 15, y - 14, 30, 22)
  context.fillRect(x - 12, y - 20, 24, 8)
  context.fillStyle = '#79ad55'
  context.fillRect(x - 10, y - 12, 9, 6)
  context.fillRect(x + 4, y - 4, 7, 5)
  context.fillStyle = '#a7cf6b'
  context.fillRect(x - 5, y - 16, 4, 3)
}

function drawDetail(context: CanvasRenderingContext2D, x: number, y: number, noise: number) {
  if (noise > 0.955) {
    // wildflower
    context.fillStyle = noise > 0.978 ? '#e8c15a' : '#d98b8b'
    context.fillRect(x, y, 3, 3)
    context.fillStyle = '#3f6a2c'
    context.fillRect(x, y + 3, 2, 3)
  } else if (noise > 0.9) {
    // pebble / grass tuft
    context.fillStyle = noise > 0.93 ? '#9aa08a' : '#6fa04a'
    context.fillRect(x + 5, y + 6, 3, 3)
    context.fillRect(x + 12, y + 12, 2, 2)
  }
}

function drawTerrain(context: CanvasRenderingContext2D, width: number, height: number, offsetX: number, offsetY: number, zoom: number, time: number) {
  context.fillStyle = OUT_OF_BOUNDS
  context.fillRect(0, 0, width, height)

  const left = Math.max(0, Math.floor(-offsetX / zoom / TILE) * TILE - TILE)
  const top = Math.max(0, Math.floor(-offsetY / zoom / TILE) * TILE - TILE)
  const right = Math.min(WORLD_WIDTH, Math.ceil((width - offsetX) / zoom / TILE) * TILE + TILE)
  const bottom = Math.min(WORLD_HEIGHT, Math.ceil((height - offsetY) / zoom / TILE) * TILE + TILE)

  context.save()
  context.translate(offsetX, offsetY)
  context.scale(zoom, zoom)
  context.imageSmoothingEnabled = false

  // Grassy / earthy ground across the whole world interior (no more black fill).
  for (let x = left; x < right; x += TILE)
    for (let y = top; y < bottom; y += TILE) {
      context.fillStyle = tileColor(x / TILE, y / TILE)
      context.fillRect(x, y, TILE + 1, TILE + 1)
      drawDetail(context, x, y, seededNoise(x / TILE + 3.1, y / TILE + 7.7))
    }

  // Sandy shoreline just inside the water moat.
  context.fillStyle = SAND
  context.fillRect(WATER_BAND, WATER_BAND, WORLD_WIDTH - WATER_BAND * 2, WORLD_HEIGHT - WATER_BAND * 2)
  context.fillStyle = SAND_DARK
  context.fillRect(WATER_BAND, WATER_BAND, WORLD_WIDTH - WATER_BAND * 2, 6)
  context.fillRect(WATER_BAND, WORLD_HEIGHT - WATER_BAND - 6, WORLD_WIDTH - WATER_BAND * 2, 6)
  // Re-draw ground on top of the sand, leaving a shoreline ring exposed.
  const inner = WATER_BAND + SHORE_BAND
  const gLeft = Math.max(inner, left)
  const gTop = Math.max(inner, top)
  const gRight = Math.min(WORLD_WIDTH - inner, right)
  const gBottom = Math.min(WORLD_HEIGHT - inner, bottom)
  for (let x = gLeft; x < gRight; x += TILE)
    for (let y = gTop; y < gBottom; y += TILE) {
      context.fillStyle = tileColor(x / TILE, y / TILE)
      context.fillRect(x, y, TILE + 1, TILE + 1)
      drawDetail(context, x, y, seededNoise(x / TILE + 3.1, y / TILE + 7.7))
    }

  // Water moat around the edges with animated shimmer.
  drawWater(context, 0, 0, WATER_BAND, WORLD_HEIGHT, time)
  drawWater(context, WORLD_WIDTH - WATER_BAND, 0, WATER_BAND, WORLD_HEIGHT, time)
  drawWater(context, 0, 0, WORLD_WIDTH, WATER_BAND, time)
  drawWater(context, 0, WORLD_HEIGHT - WATER_BAND, WORLD_WIDTH, WATER_BAND, time)

  // Forest ring just inside the shoreline, plus scattered inland bushes for life.
  const step = 150
  const ring = inner + 46
  const bxStart = Math.max(ring, left - (left % step))
  const bxEnd = Math.min(WORLD_WIDTH - ring, right + step)
  for (let x = bxStart; x < bxEnd; x += step) {
    drawBush(context, x, ring, x)
    drawBush(context, x + 40, WORLD_HEIGHT - ring, x + 2)
  }
  const byStart = Math.max(ring, top - (top % step))
  const byEnd = Math.min(WORLD_HEIGHT - ring, bottom + step)
  for (let y = byStart; y < byEnd; y += step) {
    drawBush(context, ring, y, y)
    drawBush(context, WORLD_WIDTH - ring, y + 40, y + 1)
  }

  // Sparse inland vegetation, deterministic by noise so it stays stable while panning.
  const clusterStep = 260
  const cxStart = Math.max(inner + 120, Math.floor(left / clusterStep) * clusterStep)
  const cyStart = Math.max(inner + 120, Math.floor(top / clusterStep) * clusterStep)
  for (let x = cxStart; x < Math.min(WORLD_WIDTH - inner - 120, right + clusterStep); x += clusterStep)
    for (let y = cyStart; y < Math.min(WORLD_HEIGHT - inner - 120, bottom + clusterStep); y += clusterStep) {
      const n = seededNoise(x * 0.013, y * 0.017)
      if (n > 0.82) drawBush(context, x + (n - 0.82) * 300, y + (n - 0.82) * 240, Math.floor(n * 97))
    }

  context.restore()
}

function drawFood(context: CanvasRenderingContext2D, x: number, y: number, age: number, zoom: number) {
  const half = Math.max(20, 12 / zoom)
  const pulse = Math.sin(age * 0.004) * (half * 0.22)
  context.save()
  context.translate(x, y)
  context.imageSmoothingEnabled = false
  context.fillStyle = 'rgba(230, 168, 78, .28)'
  context.fillRect(-half - pulse, -half - pulse, half * 2 + pulse * 2, half * 2 + pulse * 2)
  context.fillStyle = '#3a2a12'
  context.fillRect(-half - 2, -half - 2, half * 2 + 4, half * 2 + 4)
  context.fillStyle = '#d98b2e'
  context.fillRect(-half, -half, half * 2, half * 2)
  context.fillStyle = '#f0b95c'
  context.fillRect(-half * 0.7, -half * 0.7, half * 0.6, half * 0.6)
  context.fillStyle = '#7a4a1c'
  context.fillRect(half * 0.2, half * 0.1, half * 0.45, half * 0.45)
  context.restore()
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  context.beginPath()
  context.moveTo(x + r, y)
  context.arcTo(x + w, y, x + w, y + h, r)
  context.arcTo(x + w, y + h, x, y + h, r)
  context.arcTo(x, y + h, x, y, r)
  context.arcTo(x, y, x + w, y, r)
  context.closePath()
}

function drawCreature(context: CanvasRenderingContext2D, creature: Creature, zoom: number, renderX = creature.x, renderY = creature.y) {
  const bob = Math.sin(creature.pulse) * 3
  // Substantially larger visual size, with an on-screen floor so creatures stay
  // clearly visible when zoomed out. Simulation coords/speed/scale are untouched.
  const world = 40 * creature.scale
  const half = Math.max(world, 20 / zoom)
  // Shift the stored (greenish) hue into warm/cool bands so creatures never
  // camouflage against the green meadow. Data is untouched; this is display-only.
  const displayHue = (creature.hue + 165) % 360
  const bodyColor = `hsl(${displayHue}, 72%, 62%)`
  const rimColor = `hsl(${displayHue}, 60%, 32%)`
  const bellyColor = `hsl(${displayHue}, 68%, 80%)`
  const outline = half * 0.24

  context.save()
  context.translate(renderX, renderY + bob)

  // Soft ground shadow (not rotated).
  context.fillStyle = 'rgba(10, 14, 8, .32)'
  context.beginPath()
  context.ellipse(0, half * 1.0, half * 1.1, half * 0.45, 0, 0, TAU)
  context.fill()

  context.rotate(creature.angle)

  // Bold, size-proportional dark outline so creatures read at any zoom.
  context.fillStyle = '#17120d'
  roundRect(context, -half - outline, -half - outline, half * 2 + outline * 2, half * 2 + outline * 2, half * 0.6)
  context.fill()
  context.fillStyle = rimColor
  roundRect(context, -half, -half, half * 2, half * 2, half * 0.5)
  context.fill()
  context.fillStyle = bodyColor
  roundRect(context, -half * 0.82, -half * 0.82, half * 1.64, half * 1.5, half * 0.45)
  context.fill()
  context.fillStyle = bellyColor
  roundRect(context, -half * 0.3, half * 0.05, half * 1.05, half * 0.68, half * 0.35)
  context.fill()

  // Antennae toward the front.
  context.fillStyle = rimColor
  context.fillRect(half * 0.55, -half * 1.15, half * 0.16, half * 0.5)
  context.fillRect(half * 0.2, -half * 1.15, half * 0.16, half * 0.5)
  context.fillStyle = '#f2d584'
  context.fillRect(half * 0.53, -half * 1.25, half * 0.22, half * 0.22)
  context.fillRect(half * 0.18, -half * 1.25, half * 0.22, half * 0.22)

  // Eyes (front faces +x).
  context.fillStyle = '#fbf6e6'
  context.beginPath()
  context.arc(half * 0.5, -half * 0.28, half * 0.24, 0, TAU)
  context.arc(half * 0.5, half * 0.28, half * 0.24, 0, TAU)
  context.fill()
  context.fillStyle = '#241a1c'
  context.beginPath()
  context.arc(half * 0.58, -half * 0.28, half * 0.12, 0, TAU)
  context.arc(half * 0.58, half * 0.28, half * 0.12, 0, TAU)
  context.fill()

  // Eating cue.
  if (creature.state === 'eating') {
    context.strokeStyle = 'rgba(240, 185, 92, .7)'
    context.lineWidth = Math.max(1.5, half * 0.1)
    context.beginPath()
    context.arc(0, 0, half * 1.5, 0, TAU)
    context.stroke()
  }

  context.restore()
}

export function WorldCanvas({ creatures, food, onFeed }: WorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const creaturesRef = useRef(creatures)
  const previousCreatureByIdRef = useRef(new Map(creatures.map((creature) => [creature.id, creature])))
  const snapshotReceivedAtRef = useRef(typeof performance === 'undefined' ? 0 : performance.now())
  const foodRef = useRef(food)
  const onFeedRef = useRef(onFeed)
  if (creatures !== creaturesRef.current) {
    previousCreatureByIdRef.current = new Map(creaturesRef.current.map((creature) => [creature.id, creature]))
    creaturesRef.current = creatures
    snapshotReceivedAtRef.current = typeof performance === 'undefined' ? 0 : performance.now()
  }
  const viewRef = useRef({ x: 0, y: 0, zoom: 0 })
  const dragRef = useRef({ active: false, moved: false, x: 0, y: 0 })
  const terrainDirtyRef = useRef(true)
  foodRef.current = food
  onFeedRef.current = onFeed

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const terrainCanvas = document.createElement('canvas')
    const terrainContext = terrainCanvas.getContext('2d')
    if (!terrainContext) return
    let frame = 0
    let lastTerrainDraw = 0
    const clampView = (target: HTMLCanvasElement) => {
      const worldWidth = WORLD_WIDTH * viewRef.current.zoom
      const worldHeight = WORLD_HEIGHT * viewRef.current.zoom
      viewRef.current.x = Math.max(Math.min(0, target.clientWidth - worldWidth), Math.min(0, viewRef.current.x))
      viewRef.current.y = Math.max(Math.min(0, target.clientHeight - worldHeight), Math.min(0, viewRef.current.y))
    }
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(canvas.clientWidth * ratio)
      canvas.height = Math.floor(canvas.clientHeight * ratio)
      terrainCanvas.width = canvas.width
      terrainCanvas.height = canvas.height
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      terrainContext.setTransform(ratio, 0, 0, ratio, 0, 0)
      terrainDirtyRef.current = true
      const fit = Math.min(canvas.clientWidth / 2800, canvas.clientHeight / 2200) * 0.78
      const nextZoom = Math.max(0.05, Math.min(1.6, fit))
      if (!viewRef.current.zoom || viewRef.current.zoom < 0.06) {
        // Frame the starting sector where creatures spawn, not the empty world centre.
        const focusX = STARTING_SECTOR.x + STARTING_SECTOR.width / 2
        const focusY = STARTING_SECTOR.y + STARTING_SECTOR.height / 2
        viewRef.current.zoom = nextZoom
        viewRef.current.x = canvas.clientWidth / 2 - focusX * nextZoom
        viewRef.current.y = canvas.clientHeight / 2 - focusY * nextZoom
      }
      clampView(canvas)
    }
    const render = () => {
      const { x, y, zoom } = viewRef.current
      const time = performance.now()
      if (terrainDirtyRef.current || time - lastTerrainDraw > 250) {
        drawTerrain(terrainContext, canvas.clientWidth, canvas.clientHeight, x, y, zoom, time)
        terrainDirtyRef.current = false
        lastTerrainDraw = time
      }
      context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      context.drawImage(terrainCanvas, 0, 0, canvas.clientWidth, canvas.clientHeight)
      context.save()
      context.translate(x, y)
      context.scale(zoom, zoom)
      const visibleLeft = Math.max(0, -x / zoom - 80)
      const visibleTop = Math.max(0, -y / zoom - 80)
      const visibleRight = Math.min(WORLD_WIDTH, (canvas.clientWidth - x) / zoom + 80)
      const visibleBottom = Math.min(WORLD_HEIGHT, (canvas.clientHeight - y) / zoom + 80)
      foodRef.current.forEach((item) => {
        if (item.x >= visibleLeft && item.x <= visibleRight && item.y >= visibleTop && item.y <= visibleBottom) drawFood(context, item.x, item.y, item.age, zoom)
      })
      const previousById = previousCreatureByIdRef.current
      const interpolationWindow = 100
      const interpolation = Math.min(1, Math.max(0, (time - snapshotReceivedAtRef.current) / interpolationWindow))
      creaturesRef.current.forEach((creature) => {
        if (creature.x < visibleLeft || creature.x > visibleRight || creature.y < visibleTop || creature.y > visibleBottom) return
        const previous = previousById.get(creature.id)
        const renderX = previous ? previous.x + (creature.x - previous.x) * interpolation : creature.x
        const renderY = previous ? previous.y + (creature.y - previous.y) * interpolation : creature.y
        drawCreature(context, creature, zoom, renderX, renderY)
      })
      context.restore()
      frame = requestAnimationFrame(render)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    frame = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  const pointToWorld = (event: { currentTarget: HTMLCanvasElement; clientX: number; clientY: number }) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const { x, y, zoom } = viewRef.current
    return { x: (event.clientX - rect.left - x) / zoom, y: (event.clientY - rect.top - y) / zoom }
  }
  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { active: true, moved: false, x: event.clientX, y: event.clientY }
  }
  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag.active) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true
    viewRef.current.x += dx
    viewRef.current.y += dy
    terrainDirtyRef.current = true
    drag.x = event.clientX
    drag.y = event.clientY
    const canvas = canvasRef.current
    if (canvas) {
      const worldWidth = WORLD_WIDTH * viewRef.current.zoom
      const worldHeight = WORLD_HEIGHT * viewRef.current.zoom
      viewRef.current.x = Math.max(Math.min(0, canvas.clientWidth - worldWidth), Math.min(0, viewRef.current.x))
      viewRef.current.y = Math.max(Math.min(0, canvas.clientHeight - worldHeight), Math.min(0, viewRef.current.y))
    }
  }
  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    drag.active = false
    if (!drag.moved) {
      const point = pointToWorld(event)
      if (point.x >= 0 && point.x <= WORLD_WIDTH && point.y >= 0 && point.y <= WORLD_HEIGHT) onFeedRef.current(point.x, point.y)
    }
  }
  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const point = pointToWorld(event)
    const nextZoom = Math.max(0.05, Math.min(2, viewRef.current.zoom * (event.deltaY > 0 ? 0.9 : 1.1)))
    viewRef.current.x = event.nativeEvent.offsetX - point.x * nextZoom
    viewRef.current.y = event.nativeEvent.offsetY - point.y * nextZoom
    viewRef.current.zoom = nextZoom
    terrainDirtyRef.current = true
    const canvas = canvasRef.current
    if (canvas) {
      const worldWidth = WORLD_WIDTH * viewRef.current.zoom
      const worldHeight = WORLD_HEIGHT * viewRef.current.zoom
      viewRef.current.x = Math.max(Math.min(0, canvas.clientWidth - worldWidth), Math.min(0, viewRef.current.x))
      viewRef.current.y = Math.max(Math.min(0, canvas.clientHeight - worldHeight), Math.min(0, viewRef.current.y))
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="petri-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        dragRef.current.active = false
      }}
      onWheel={handleWheel}
      aria-label="Live pixel-art Earth-scale Petri ecosystem. Click to place food, drag to pan, and scroll to zoom."
      role="img"
    />
  )
}
