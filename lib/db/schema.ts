import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const petriWorld = pgTable('petri_world', {
  id: integer('id').primaryKey(),
  status: text('status').notNull().default('stopped'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  creatures: jsonb('creatures').notNull().default([]),
  food: jsonb('food').notNull().default([]),
  events: jsonb('events').notNull().default([]),
  births: integer('births').notNull().default(0),
  deaths: integer('deaths').notNull().default(0),
  generation: integer('generation').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
