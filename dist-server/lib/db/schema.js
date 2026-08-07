"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.petriWorld = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.petriWorld = (0, pg_core_1.pgTable)('petri_world', {
    id: (0, pg_core_1.integer)('id').primaryKey(),
    status: (0, pg_core_1.text)('status').notNull().default('stopped'),
    startedAt: (0, pg_core_1.timestamp)('started_at', { withTimezone: true }),
    creatures: (0, pg_core_1.jsonb)('creatures').notNull().default([]),
    food: (0, pg_core_1.jsonb)('food').notNull().default([]),
    events: (0, pg_core_1.jsonb)('events').notNull().default([]),
    births: (0, pg_core_1.integer)('births').notNull().default(0),
    deaths: (0, pg_core_1.integer)('deaths').notNull().default(0),
    generation: (0, pg_core_1.integer)('generation').notNull().default(1),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
