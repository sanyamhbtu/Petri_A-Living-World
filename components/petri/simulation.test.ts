import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addFood,
  BASE_METABOLISM,
  FOOD_ENERGY,
  FOOD_LIFETIME,
  FOOD_TARGET,
  MAX_AGE_MS,
  REPRODUCTION_COOLDOWN_MS,
  REPRODUCTION_ENERGY_COST,
  REPRODUCTION_MIN_AGE_MS,
  createCreature,
  createInitialSnapshot,
  tickWorld,
} from './simulation'
import { WORLD_HEIGHT, WORLD_MARGIN, WORLD_WIDTH } from './types'
import type { Creature, WorldSnapshot } from './types'

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const MATURITY_MS = 12 * HOUR_MS

function running(partial: Partial<WorldSnapshot> & { creatures: Creature[] }): WorldSnapshot {
  const base = createInitialSnapshot()
  return { ...base, food: [], ...partial, status: 'running' }
}

test('creatures stay inside the Earth-scale world', () => {
  const snapshot = createInitialSnapshot()
  const next = tickWorld({ ...snapshot, status: 'running' }, 1000)
  assert.ok(next.creatures.every((creature) => creature.x >= 0 && creature.x <= WORLD_WIDTH && creature.y >= 0 && creature.y <= WORLD_HEIGHT))
})

test('food is consumed and restores creature energy', () => {
  const creature = createCreature(0, 1, 400, 400, { energy: 20, speed: 0 })
  const fed = addFood(running({ creatures: [creature] }), 400, 400)
  const next = tickWorld(fed, 1000)
  // Regeneration only makes new food edible on the following tick, so this tick the
  // creature can only have eaten the single placed food.
  assert.equal(next.creatures[0].eaten, 1)
  assert.ok(next.creatures[0].energy > 20)
  assert.equal(next.food.some((food) => food.x === 400 && food.y === 400), false)
})

test('starving creatures die and increment deaths', () => {
  const creature = createCreature(0, 1, 5000, 5000, { energy: 0 })
  const next = tickWorld(running({ creatures: [creature] }), 1000)
  assert.equal(next.creatures.length, 0)
  assert.equal(next.deaths, 1)
})

test('a full creature survives close to five real days without eating', () => {
  // No initial food means the creature cannot eat during a single tick (regenerated
  // food only becomes edible next tick), so depletion is deterministic.
  const almostFiveDays = createCreature(0, 1, 5000, 5000, { energy: 100, speed: 0 })
  const aliveAt = tickWorld(running({ creatures: [almostFiveDays] }), 4.9 * DAY_MS)
  assert.equal(aliveAt.creatures.length, 1, 'should still be alive just under five days')
  assert.ok(aliveAt.creatures[0].energy > 0)

  const past = createCreature(0, 1, 5000, 5000, { energy: 100, speed: 0 })
  const deadAt = tickWorld(running({ creatures: [past] }), 5.1 * DAY_MS)
  assert.equal(deadAt.creatures.length, 0, 'should have starved just past five days')
  assert.equal(deadAt.deaths, 1)
})

test('resting energy burns down gradually, roughly 20 percent per day', () => {
  const creature = createCreature(0, 1, 5000, 5000, { energy: 100, speed: 0 })
  const next = tickWorld(running({ creatures: [creature] }), DAY_MS)
  const burned = 100 - next.creatures[0].energy
  assert.ok(burned > 18 && burned < 22, `expected ~20 energy burned in a day, got ${burned}`)
})

test('two mature, well-fed, nearby creatures reproduce', () => {
  const parentA = createCreature(0, 1, 5000, 5000, { energy: 100, speed: 0, age: MATURITY_MS, reproductionCooldown: 0 })
  const parentB = createCreature(1, 1, 5010, 5010, { energy: 100, speed: 0, age: MATURITY_MS, reproductionCooldown: 0 })
  const next = tickWorld(running({ creatures: [parentA, parentB] }), 1000)
  assert.equal(next.births, 1)
  assert.equal(next.creatures.length, 3)
  assert.equal(next.generation, 2)
})

test('immature, cooling-down, or hungry creatures do not reproduce', () => {
  const immature = tickWorld(
    running({ creatures: [createCreature(0, 1, 5000, 5000, { energy: 100, speed: 0, age: 0 }), createCreature(1, 1, 5010, 5010, { energy: 100, speed: 0, age: 0 })] }),
    1000,
  )
  assert.equal(immature.births, 0)

  const coolingDown = tickWorld(
    running({ creatures: [createCreature(0, 1, 5000, 5000, { energy: 100, speed: 0, age: MATURITY_MS, reproductionCooldown: 12 * HOUR_MS }), createCreature(1, 1, 5010, 5010, { energy: 100, speed: 0, age: MATURITY_MS, reproductionCooldown: 12 * HOUR_MS })] }),
    1000,
  )
  assert.equal(coolingDown.births, 0)

  const hungry = tickWorld(
    running({ creatures: [createCreature(0, 1, 5000, 5000, { energy: 40, speed: 0, age: MATURITY_MS, reproductionCooldown: 0 }), createCreature(1, 1, 5010, 5010, { energy: 40, speed: 0, age: MATURITY_MS, reproductionCooldown: 0 })] }),
    1000,
  )
  assert.equal(hungry.births, 0)
})

test('a fed colony grows across successive reproduction cycles', () => {
  const colony = Array.from({ length: 4 }, (_, index) => createCreature(index, 1, 5000, 5000, { energy: 100, speed: 0, age: MATURITY_MS, reproductionCooldown: 0 }))
  const cycleOne = tickWorld(running({ creatures: colony }), 1000)
  assert.ok(cycleOne.creatures.length > 4, 'first cycle should add offspring')

  // Simulate the world staying fed: refill energy, then advance past the cooldown so
  // both the original adults and their now-mature offspring can reproduce again.
  const refuelled: WorldSnapshot = { ...cycleOne, creatures: cycleOne.creatures.map((creature) => ({ ...creature, energy: 100 })) }
  const cycleTwo = tickWorld(refuelled, 12 * HOUR_MS + 1000)
  assert.ok(cycleTwo.creatures.length > cycleOne.creatures.length, 'population should keep growing when fed, not shrink')
})

test('metabolism is derived from the five-day starvation target', () => {
  assert.equal(5 * DAY_MS, 432_000_000)
  assert.equal(BASE_METABOLISM, 100 / 432_000_000)
})

test('food expires and regeneration restores the ecosystem supply', () => {
  const stale = { id: 'stale-food', x: 5000, y: 5000, age: FOOD_LIFETIME - 1 }
  const world = running({ creatures: [createCreature(0, 1, 5000, 5000, { energy: 100, speed: 0 })], food: [stale] })
  const next = tickWorld(world, 1000)
  assert.ok(!next.food.some((food) => food.id === stale.id), 'expired food should be removed')
  assert.ok(next.food.length > 0, 'expired food should be replaced over time')
})

test('aging eventually removes a creature and records the death event', () => {
  const creature = createCreature(0, 1, 5000, 5000, { age: MAX_AGE_MS - 1, energy: 100, speed: 0 })
  const next = tickWorld(running({ creatures: [creature] }), 1000)
  assert.equal(next.creatures.length, 0)
  assert.equal(next.deaths, 1)
  assert.equal(next.events[0]?.kind, 'death')
})

test('movement advances independently and hungry creatures seek nearby food', () => {
  const hungry = createCreature(0, 1, 1200, 1200, { angle: 0, speed: 1, energy: 35 })
  const wanderer = createCreature(1, 1, 1200, 1800, { angle: Math.PI / 2, speed: 1, energy: 100 })
  const next = tickWorld(running({ creatures: [hungry, wanderer], food: [{ id: 'target-food', x: 1250, y: 1200, age: 0 }] }), 100)
  assert.notEqual(next.creatures[0].x, hungry.x)
  assert.notEqual(next.creatures[1].y, wanderer.y)
  assert.equal(next.creatures[0].state, 'seeking_food')
  assert.ok(Math.hypot(next.creatures[0].x - 1250, next.creatures[0].y - 1200) < 50)
})

test('movement respects world boundaries', () => {
  const creature = createCreature(0, 1, WORLD_MARGIN, WORLD_MARGIN, { angle: Math.PI, speed: 1, energy: 100 })
  const next = tickWorld(running({ creatures: [creature] }), 1000)
  assert.ok(next.creatures[0].x >= WORLD_MARGIN)
  assert.ok(next.creatures[0].y >= WORLD_MARGIN)
  assert.ok(next.creatures[0].x <= WORLD_WIDTH - WORLD_MARGIN)
  assert.ok(next.creatures[0].y <= WORLD_HEIGHT - WORLD_MARGIN)
})

test('reproduction charges both parents, applies cooldown, and records a birth', () => {
  const parentA = createCreature(0, 1, 5000, 5000, { energy: 100, speed: 0, age: REPRODUCTION_MIN_AGE_MS })
  const parentB = createCreature(1, 1, 5010, 5010, { energy: 100, speed: 0, age: REPRODUCTION_MIN_AGE_MS })
  const next = tickWorld(running({ creatures: [parentA, parentB] }), 1000)
  assert.equal(next.births, 1)
  assert.equal(next.events[0]?.kind, 'birth')
  assert.ok(next.creatures[0].energy < 100 - BASE_METABOLISM)
  assert.equal(next.creatures[0].reproductionCooldown, REPRODUCTION_COOLDOWN_MS)
  assert.equal(next.creatures[0].energy, 100 - 1000 * BASE_METABOLISM - REPRODUCTION_ENERGY_COST)
  const cooled = tickWorld(next, 1000)
  assert.equal(cooled.births, 1)
})

test('food restores energy without exceeding the energy maximum', () => {
  const creature = createCreature(0, 1, 400, 400, { energy: 90, speed: 0 })
  const next = tickWorld(addFood(running({ creatures: [creature] }), 400, 400), 1000)
  assert.equal(next.creatures[0].energy, 100)
  assert.equal(next.creatures[0].eaten, 1)
  assert.equal(FOOD_ENERGY, 42)
})

test('the world regenerates a standing food supply without overfilling', () => {
  let world = createInitialSnapshot()
  world = { ...world, status: 'running' }
  world = tickWorld(world, 100_000)
  assert.ok(world.food.length > 0, 'food should regenerate from an empty world')
  assert.ok(world.food.length <= FOOD_TARGET, 'food should not exceed the standing target')

  for (let i = 0; i < 5; i += 1) world = tickWorld(world, 100_000)
  assert.ok(world.food.length > 0, 'food supply should be sustained over time')
  assert.ok(world.food.length <= 60, 'food should stay capped at the standing target')
  assert.ok(world.creatures.length >= 12, 'a fed population should not collapse')
})

test('population cap prevents offspring beyond the authoritative limit', () => {
  const capped = Array.from({ length: 180 }, (_, index) => createCreature(index, 1, 5000, 5000, {
    energy: 100,
    speed: 0,
    age: MATURITY_MS,
    reproductionCooldown: 0,
  }))
  const next = tickWorld(running({ creatures: capped }), 1000)
  assert.equal(next.creatures.length, 180)
  assert.equal(next.births, 0)
})

test('adequately fed adults can produce more births than deaths', () => {
  let world = running({
    creatures: Array.from({ length: 6 }, (_, index) => createCreature(index, 1, 5000 + index, 5000, {
      energy: 100,
      speed: 0,
      age: MATURITY_MS,
      reproductionCooldown: 0,
    })),
    food: [],
  })
  const startingDeaths = world.deaths
  for (let cycle = 0; cycle < 3; cycle += 1) {
    world = tickWorld({
      ...world,
      creatures: world.creatures.map((creature) => ({ ...creature, energy: 100 })),
    }, REPRODUCTION_COOLDOWN_MS + 1000)
  }
  assert.ok(world.births > world.deaths - startingDeaths)
  assert.ok(world.creatures.length > 6)
})
