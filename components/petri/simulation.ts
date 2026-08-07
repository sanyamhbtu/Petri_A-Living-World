import type { Creature, Food, WorldEvent, WorldSnapshot } from './types'

const SPECIES = ['mossling', 'mossling', 'mossling', 'mossling', 'mossling']
const NAMES = ['Mossling', 'Mossling', 'Mossling']

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function createCreature(index: number, generation = 1): Creature {
  return {
    id: id('creature'),
    x: 320 + (index % 4) * 100 + Math.random() * 50,
    y: 220 + Math.floor(index / 4) * 100 + Math.random() * 50,
    angle: Math.random() * Math.PI * 2,
    hue: 92 + Math.random() * 34,
    scale: 0.82 + Math.random() * 0.35,
    speed: 0.45 + Math.random() * 0.35,
    generation,
    state: 'wandering',
    pulse: Math.random() * Math.PI * 2,
  }
}

export function createInitialSnapshot(): WorldSnapshot {
  const creatures = Array.from({ length: 3 }, (_, index) => createCreature(index))
  const food: Food[] = []
  const events: WorldEvent[] = [
    { id: 1, kind: 'birth', title: 'World prepared', detail: 'Three Mosslings are waiting', time: 'now', color: 'mint' },
  ]
  return { creatures, food, events, births: 0, deaths: 0, generation: 1, startedAt: 0, status: 'stopped' }
}

export function tickWorld(snapshot: WorldSnapshot, elapsed: number): WorldSnapshot {
  const next = structuredClone(snapshot)
  const nearbyFood = [...next.food]

  next.creatures = next.creatures.flatMap((creature) => {
    const nextCreature = creature
    nextCreature.pulse += elapsed * 0.005
    const target = nearbyFood.find((item) => Math.hypot(item.x - nextCreature.x, item.y - nextCreature.y) < 150)
    nextCreature.state = target ? 'seeking_food' : 'wandering'
    if (target) {
      nextCreature.angle = Math.atan2(target.y - nextCreature.y, target.x - nextCreature.x)
    } else {
      nextCreature.angle += (Math.random() - 0.5) * 0.08
    }
    nextCreature.x += Math.cos(nextCreature.angle) * nextCreature.speed * elapsed * 0.018
    nextCreature.y += Math.sin(nextCreature.angle) * nextCreature.speed * elapsed * 0.018
    nextCreature.x = Math.max(80, Math.min(1720, nextCreature.x))
    nextCreature.y = Math.max(80, Math.min(1020, nextCreature.y))

    if (target && Math.hypot(target.x - nextCreature.x, target.y - nextCreature.y) < 22) {
      const foodIndex = next.food.findIndex((item) => item.id === target.id)
      if (foodIndex >= 0) next.food.splice(foodIndex, 1)
      nextCreature.state = 'eating'
    }
    return nextCreature
  })

  next.food = next.food.map((item) => ({ ...item, age: item.age + elapsed })).filter((item) => item.age < 30000)
  return next
}

export function addFood(snapshot: WorldSnapshot, x: number, y: number): WorldSnapshot {
  const next = structuredClone(snapshot)
  next.food.push({ id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, x, y, age: 0 })
  next.events.unshift({ id: Date.now(), kind: 'feed', title: 'Food placed', detail: 'A visitor changed the ecosystem', time: 'now', color: 'amber' })
  next.events = next.events.slice(0, 8)
  return next
}

export function mutateCreature(snapshot: WorldSnapshot): WorldSnapshot {
  const next = structuredClone(snapshot)
  const creature = next.creatures[Math.floor(Math.random() * next.creatures.length)]
  if (!creature) return next
  creature.hue = 20 + Math.random() * 150
  creature.scale += 0.1
  creature.pulse = 0
  next.events.unshift({ id: Date.now(), kind: 'mutation', title: 'Mutation triggered', detail: 'A new trait is moving through the dark', time: 'now', color: 'coral' })
  next.events = next.events.slice(0, 8)
  return next
}

export function maybeReproduce(snapshot: WorldSnapshot): WorldSnapshot {
  const next = structuredClone(snapshot)
  const cluster = next.creatures.filter((creature) => creature.x > 500 && creature.x < 760 && creature.y > 260 && creature.y < 500)
  if (cluster.length < 3 || Math.random() > 0.014 || next.creatures.length > 18) return next
  const parent = cluster[0]
  next.creatures.push({ ...createCreature(0, parent.generation + 1), x: parent.x + 18, y: parent.y + 18, hue: parent.hue + (Math.random() - 0.5) * 18 })
  next.births += 1
  next.events.unshift({ id: Date.now(), kind: 'birth', title: 'New life', detail: `Mossling · generation ${parent.generation + 1}`, time: 'now', color: 'mint' })
  next.events = next.events.slice(0, 8)
  return next
}

export function speciesName(creature: Creature) {
  return SPECIES[creature.generation % SPECIES.length] ?? NAMES[0]
}
