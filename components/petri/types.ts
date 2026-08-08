export const WORLD_WIDTH = 18000
export const WORLD_HEIGHT = 11000
export const WORLD_MARGIN = 140
export const STARTING_SECTOR = { x: 3200, y: 2200, width: 2800, height: 2200 }

export type CreatureState = 'wandering' | 'seeking_food' | 'eating' | 'reproducing'

export type Creature = {
  id: string
  x: number
  y: number
  angle: number
  hue: number
  scale: number
  speed: number
  generation: number
  state: CreatureState
  pulse: number
  energy: number
  age: number
  eaten: number
  lastAteAt: number
  reproductionCooldown: number
}

export type Food = {
  id: string
  x: number
  y: number
  age: number
}

export type WorldEvent = {
  id: number
  kind: 'birth' | 'death' | 'reproduction' | 'feed' | 'mutation'
  title: string
  detail: string
  time: string
  color: string
}

export type WorldSnapshot = {
  creatures: Creature[]
  food: Food[]
  events: WorldEvent[]
  births: number
  deaths: number
  generation: number
  startedAt: number
  status: 'stopped' | 'running'
}
