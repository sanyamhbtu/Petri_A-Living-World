import type { Creature, Food, WorldEvent, WorldSnapshot } from './types'
import { WORLD_HEIGHT, WORLD_MARGIN, WORLD_WIDTH, STARTING_SECTOR } from './types'

const SPECIES = ['mossling', 'mossling', 'mossling', 'mossling', 'mossling']
const MAX_CREATURES = 180

// The server ticks every TICK_MS and passes that same value as `elapsed`, so
// one simulated millisecond equals one real millisecond. All durations below are
// therefore expressed in real wall-clock time.
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

const ENERGY_MAX = 100
// A well-fed creature that stops eating should take ~5 real days to starve. Energy
// burns down linearly from full to zero over STARVATION_MS while at rest, plus a
// small movement surcharge, so a roaming creature lasts a little under five days.
const STARVATION_MS = 5 * DAY_MS
const BASE_METABOLISM = ENERGY_MAX / STARVATION_MS // energy per ms at rest
const MOVE_METABOLISM = 0.1 // moving adds up to ~10% on top of the resting burn
// Natural lifespan sits far beyond the starvation window so age never masks the
// five-day survival requirement, while still bounding the population over time.
const MAX_AGE_MS = 30 * DAY_MS

const FOOD_LIFETIME = 30 * 60_000 // uneaten food lingers for 30 minutes
const FOOD_TARGET = 60 // standing food the world continuously regenerates toward
const FOOD_REGEN_PER_MS = 0.0006 // ~0.6 new food per second while below target
const FOOD_ENERGY = 42 // energy restored per meal
const FOOD_SPAWN_RADIUS = 900 // food regenerates near living creatures so it stays reachable

// Reproduction is gated on maturity, energy and a per-creature cooldown rather than
// on chance, so a healthy, fed colony reliably grows instead of drifting extinct.
const REPRODUCTION_MIN_AGE_MS = 12 * HOUR_MS // maturity
const REPRODUCTION_COOLDOWN_MS = 12 * HOUR_MS // rest between births per creature
const REPRODUCTION_MIN_ENERGY = 60
const REPRODUCTION_ENERGY_COST = 22 // energy each parent spends on an offspring
const REPRODUCTION_DISTANCE = 220
const NEWBORN_ENERGY = 72

const EAT_DISTANCE = 34
const SEEK_RANGE = 680

function id(prefix: string) { return `${prefix}-${Math.random().toString(36).slice(2, 10)}` }
function randomBetween(min: number, max: number) { return min + Math.random() * (max - min) }
function event(kind: WorldEvent['kind'], title: string, detail: string, color: string): WorldEvent { return { id: Date.now() + Math.floor(Math.random() * 1000), kind, title, detail, time: 'now', color } }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)) }

export function createCreature(
  index: number,
  generation = 1,
  x = randomBetween(STARTING_SECTOR.x, STARTING_SECTOR.x + STARTING_SECTOR.width),
  y = randomBetween(STARTING_SECTOR.y, STARTING_SECTOR.y + STARTING_SECTOR.height),
  overrides: Partial<Creature> = {},
): Creature {
  return {
    id: id('creature'),
    x,
    y,
    angle: Math.random() * Math.PI * 2,
    hue: 92 + Math.random() * 34,
    scale: 0.82 + Math.random() * 0.35,
    speed: 0.45 + Math.random() * 0.35,
    generation,
    state: 'wandering',
    pulse: Math.random() * Math.PI * 2,
    energy: randomBetween(88, 100),
    age: 0,
    eaten: 0,
    lastAteAt: 0,
    reproductionCooldown: 0,
    ...overrides,
  }
}

export function createInitialSnapshot(): WorldSnapshot {
  // Seed the world with mature adults so the colony can begin reproducing once fed,
  // rather than waiting a maturity cycle before any births are possible.
  const creatures = Array.from({ length: 12 }, (_, index) =>
    createCreature(index, 1, undefined, undefined, { age: randomBetween(REPRODUCTION_MIN_AGE_MS, REPRODUCTION_MIN_AGE_MS * 3) }),
  )
  return { creatures, food: [], events: [event('birth', 'World prepared', 'Twelve Mosslings are waiting in the starting sector', 'mint')], births: 0, deaths: 0, generation: 1, startedAt: 0, status: 'stopped' }
}

export function tickWorld(snapshot: WorldSnapshot, elapsed: number): WorldSnapshot {
  const next = structuredClone(snapshot)
  const consumed = new Set<string>()
  const deaths: Creature[] = []

  next.creatures = next.creatures.flatMap((creature) => {
    const target = next.food.filter((item) => !consumed.has(item.id)).sort((a, b) => Math.hypot(a.x - creature.x, a.y - creature.y) - Math.hypot(b.x - creature.x, b.y - creature.y))[0]
    const nextCreature = creature
    nextCreature.age += elapsed
    nextCreature.pulse += elapsed * 0.005
    if (nextCreature.reproductionCooldown > 0) nextCreature.reproductionCooldown = Math.max(0, nextCreature.reproductionCooldown - elapsed)
    // Gradual, time-based hunger: full energy lasts ~5 real days at rest.
    nextCreature.energy -= elapsed * BASE_METABOLISM * (1 + nextCreature.speed * MOVE_METABOLISM)
    nextCreature.state = target && Math.hypot(target.x - nextCreature.x, target.y - nextCreature.y) < SEEK_RANGE ? 'seeking_food' : 'wandering'
    if (target && nextCreature.state === 'seeking_food') nextCreature.angle = Math.atan2(target.y - nextCreature.y, target.x - nextCreature.x)
    else nextCreature.angle += (Math.random() - 0.5) * 0.08
    const edgePadding = 520
    if (nextCreature.x < WORLD_MARGIN + edgePadding || nextCreature.x > WORLD_WIDTH - WORLD_MARGIN - edgePadding) nextCreature.angle = Math.PI - nextCreature.angle
    if (nextCreature.y < WORLD_MARGIN + edgePadding || nextCreature.y > WORLD_HEIGHT - WORLD_MARGIN - edgePadding) nextCreature.angle = -nextCreature.angle
    nextCreature.x = clamp(nextCreature.x + Math.cos(nextCreature.angle) * nextCreature.speed * elapsed * 0.022, WORLD_MARGIN, WORLD_WIDTH - WORLD_MARGIN)
    nextCreature.y = clamp(nextCreature.y + Math.sin(nextCreature.angle) * nextCreature.speed * elapsed * 0.022, WORLD_MARGIN, WORLD_HEIGHT - WORLD_MARGIN)
    if (target && Math.hypot(target.x - nextCreature.x, target.y - nextCreature.y) < EAT_DISTANCE) {
      consumed.add(target.id)
      nextCreature.state = 'eating'
      nextCreature.energy = clamp(nextCreature.energy + FOOD_ENERGY, 0, ENERGY_MAX)
      nextCreature.eaten += 1
      nextCreature.lastAteAt = nextCreature.age
    }
    if (nextCreature.energy <= 0 || nextCreature.age >= MAX_AGE_MS) { deaths.push(nextCreature); return [] }
    return nextCreature
  })

  next.food = next.food.filter((item) => !consumed.has(item.id) && item.age + elapsed < FOOD_LIFETIME).map((item) => ({ ...item, age: item.age + elapsed }))
  regenerateFood(next, elapsed)
  next.deaths += deaths.length
  if (deaths.length) next.events.unshift(...deaths.slice(0, 2).map((dead) => event('death', 'Life returned to soil', `${speciesName(dead)} died after ${Math.floor(dead.age / 1000)} sec`, 'coral')))
  next.events = next.events.slice(0, 8)
  return maybeReproduce(next)
}

// Continuously top the world up toward a standing food supply, spawning near living
// creatures so meals stay reachable and the ecosystem can sustain itself.
function regenerateFood(snapshot: WorldSnapshot, elapsed: number) {
  const deficit = FOOD_TARGET - snapshot.food.length
  if (deficit <= 0) return
  const spawns = Math.min(deficit, Math.floor(elapsed * FOOD_REGEN_PER_MS + Math.random()))
  for (let i = 0; i < spawns; i += 1) {
    const anchor = snapshot.creatures.length ? snapshot.creatures[Math.floor(Math.random() * snapshot.creatures.length)] : null
    const baseX = anchor ? anchor.x : STARTING_SECTOR.x + STARTING_SECTOR.width / 2
    const baseY = anchor ? anchor.y : STARTING_SECTOR.y + STARTING_SECTOR.height / 2
    const x = clamp(baseX + randomBetween(-FOOD_SPAWN_RADIUS, FOOD_SPAWN_RADIUS), WORLD_MARGIN, WORLD_WIDTH - WORLD_MARGIN)
    const y = clamp(baseY + randomBetween(-FOOD_SPAWN_RADIUS, FOOD_SPAWN_RADIUS), WORLD_MARGIN, WORLD_HEIGHT - WORLD_MARGIN)
    snapshot.food.push({ id: id('food'), x, y, age: 0 })
  }
}

export function addFood(snapshot: WorldSnapshot, x: number, y: number): WorldSnapshot {
  const next = structuredClone(snapshot)
  next.food.push({ id: id('food'), x: clamp(x, 0, WORLD_WIDTH), y: clamp(y, 0, WORLD_HEIGHT), age: 0 })
  next.events.unshift(event('feed', 'Food placed', 'A visitor changed the ecosystem', 'amber'))
  next.events = next.events.slice(0, 8)
  return next
}

export function mutateCreature(snapshot: WorldSnapshot): WorldSnapshot {
  const next = structuredClone(snapshot)
  const creature = next.creatures[Math.floor(Math.random() * next.creatures.length)]
  if (!creature) return next
  creature.hue = 20 + Math.random() * 150
  creature.scale = clamp(creature.scale + 0.1, 0.6, 1.8)
  creature.pulse = 0
  next.events.unshift(event('mutation', 'Mutation triggered', 'A new trait is moving through the dark', 'coral'))
  next.events = next.events.slice(0, 8)
  return next
}

// A creature may reproduce once it is mature, off cooldown and well fed.
function canReproduce(creature: Creature) {
  return creature.age >= REPRODUCTION_MIN_AGE_MS && creature.reproductionCooldown <= 0 && creature.energy >= REPRODUCTION_MIN_ENERGY
}

export function maybeReproduce(snapshot: WorldSnapshot): WorldSnapshot {
  const next = structuredClone(snapshot)
  if (next.creatures.length < 2 || next.creatures.length >= MAX_CREATURES) return next
  const used = new Set<string>()
  const newborns: Creature[] = []
  for (let index = 0; index < next.creatures.length; index += 1) {
    if (next.creatures.length + newborns.length >= MAX_CREATURES) break
    const parent = next.creatures[index]
    if (used.has(parent.id) || !canReproduce(parent)) continue
    const partner = next.creatures.slice(index + 1).find((candidate) => !used.has(candidate.id) && canReproduce(candidate) && Math.hypot(candidate.x - parent.x, candidate.y - parent.y) < REPRODUCTION_DISTANCE)
    if (!partner) continue
    used.add(parent.id)
    used.add(partner.id)
    const generation = Math.max(parent.generation, partner.generation) + 1
    parent.energy = Math.max(0, parent.energy - REPRODUCTION_ENERGY_COST)
    partner.energy = Math.max(0, partner.energy - REPRODUCTION_ENERGY_COST)
    parent.reproductionCooldown = REPRODUCTION_COOLDOWN_MS
    partner.reproductionCooldown = REPRODUCTION_COOLDOWN_MS
    parent.state = 'reproducing'
    partner.state = 'reproducing'
    const childHue = clamp((parent.hue + partner.hue) / 2 + randomBetween(-8, 8), 20, 150)
    const childScale = clamp((parent.scale + partner.scale) / 2 + randomBetween(-0.05, 0.05), 0.6, 1.8)
    newborns.push(
      createCreature(
        next.creatures.length + newborns.length,
        generation,
        clamp((parent.x + partner.x) / 2 + randomBetween(-40, 40), WORLD_MARGIN, WORLD_WIDTH - WORLD_MARGIN),
        clamp((parent.y + partner.y) / 2 + randomBetween(-40, 40), WORLD_MARGIN, WORLD_HEIGHT - WORLD_MARGIN),
        { energy: NEWBORN_ENERGY, reproductionCooldown: REPRODUCTION_COOLDOWN_MS, hue: childHue, scale: childScale },
      ),
    )
    next.births += 1
    next.generation = Math.max(next.generation, generation)
    next.events.unshift(event('reproduction', 'New life', `Mossling · generation ${generation}`, 'mint'))
  }
  if (newborns.length) {
    next.creatures.push(...newborns)
    next.events = next.events.slice(0, 8)
  }
  return next
}

export function speciesName(creature: Creature) { return SPECIES[creature.generation % SPECIES.length] ?? 'Mossling' }
