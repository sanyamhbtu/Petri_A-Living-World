import test from 'node:test'
import assert from 'node:assert/strict'
import { addFood, createInitialSnapshot, tickWorld } from './simulation'
import { WORLD_HEIGHT, WORLD_WIDTH } from './types'

test('creatures stay inside the Earth-scale world', () => {
  const snapshot = createInitialSnapshot()
  const next = tickWorld({ ...snapshot, status: 'running' }, 1000)
  assert.ok(next.creatures.every((creature) => creature.x >= 0 && creature.x <= WORLD_WIDTH && creature.y >= 0 && creature.y <= WORLD_HEIGHT))
})

test('food is consumed and restores creature energy', () => {
  const snapshot = createInitialSnapshot()
  const creature = snapshot.creatures[0]
  creature.x = 400
  creature.y = 400
  creature.energy = 20
  const fed = addFood(snapshot, 400, 400)
  const next = tickWorld({ ...fed, status: 'running' }, 1000)
  assert.equal(next.food.length, 0)
  assert.ok(next.creatures[0].energy > 20)
  assert.equal(next.creatures[0].eaten, 1)
})

test('starving creatures die and increment deaths', () => {
  const snapshot = createInitialSnapshot()
  snapshot.creatures = [snapshot.creatures[0]]
  snapshot.creatures[0].energy = 0
  const next = tickWorld({ ...snapshot, status: 'running' }, 1000)
  assert.equal(next.creatures.length, 0)
  assert.equal(next.deaths, 1)
})
