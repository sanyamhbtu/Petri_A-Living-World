"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEWBORN_ENERGY = exports.REPRODUCTION_DISTANCE = exports.REPRODUCTION_ENERGY_COST = exports.REPRODUCTION_MIN_ENERGY = exports.REPRODUCTION_COOLDOWN_MS = exports.REPRODUCTION_MIN_AGE_MS = exports.FOOD_SPAWN_RADIUS = exports.FOOD_ENERGY = exports.FOOD_REGEN_PER_MS = exports.FOOD_TARGET = exports.FOOD_LIFETIME = exports.MAX_AGE_MS = exports.MOVE_METABOLISM = exports.BASE_METABOLISM = exports.STARVATION_MS = exports.ENERGY_MAX = void 0;
exports.createCreature = createCreature;
exports.createInitialSnapshot = createInitialSnapshot;
exports.tickWorld = tickWorld;
exports.addFood = addFood;
exports.mutateCreature = mutateCreature;
exports.maybeReproduce = maybeReproduce;
exports.speciesName = speciesName;
const types_1 = require("./types");
const SPECIES = ['mossling', 'mossling', 'mossling', 'mossling', 'mossling'];
const MAX_CREATURES = 180;
// The server ticks every TICK_MS and passes that same value as `elapsed`, so
// one simulated millisecond equals one real millisecond. All durations below are
// therefore expressed in real wall-clock time.
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
exports.ENERGY_MAX = 100;
// Five real days is 432,000,000 simulated milliseconds. At rest, a full energy
// reserve therefore loses 100 / 432,000,000 energy per simulated millisecond.
exports.STARVATION_MS = 5 * DAY_MS;
exports.BASE_METABOLISM = exports.ENERGY_MAX / exports.STARVATION_MS;
exports.MOVE_METABOLISM = 0.1;
// Aging remains independent from starvation and eventually removes very old adults.
exports.MAX_AGE_MS = 30 * DAY_MS;
exports.FOOD_LIFETIME = 30 * 60_000;
exports.FOOD_TARGET = 60;
exports.FOOD_REGEN_PER_MS = 0.0006;
exports.FOOD_ENERGY = 42;
exports.FOOD_SPAWN_RADIUS = 900;
// Reproduction is gated on maturity, energy and a per-creature cooldown rather than
// on chance, so a healthy, fed colony reliably grows instead of drifting extinct.
exports.REPRODUCTION_MIN_AGE_MS = 12 * HOUR_MS;
exports.REPRODUCTION_COOLDOWN_MS = 12 * HOUR_MS;
exports.REPRODUCTION_MIN_ENERGY = 60;
exports.REPRODUCTION_ENERGY_COST = 22;
exports.REPRODUCTION_DISTANCE = 220;
exports.NEWBORN_ENERGY = 72;
const EAT_DISTANCE = 34;
const SEEK_RANGE = 680;
const MOVEMENT_SCALE = 0.12;
const MAX_TURN_PER_MS = 0.0018;
function id(prefix) { return `${prefix}-${Math.random().toString(36).slice(2, 10)}`; }
function angleDelta(from, to) { return Math.atan2(Math.sin(to - from), Math.cos(to - from)); }
function stableWander(idValue, pulse) {
    let hash = 0;
    for (let index = 0; index < idValue.length; index += 1)
        hash = (hash * 31 + idValue.charCodeAt(index)) | 0;
    return Math.sin(pulse * 0.0011 + hash * 0.017) * 0.0009;
}
function randomBetween(min, max) { return min + Math.random() * (max - min); }
function event(kind, title, detail, color) { return { id: Date.now() + Math.floor(Math.random() * 1000), kind, title, detail, time: 'now', color }; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function createCreature(index, generation = 1, x = randomBetween(types_1.STARTING_SECTOR.x, types_1.STARTING_SECTOR.x + types_1.STARTING_SECTOR.width), y = randomBetween(types_1.STARTING_SECTOR.y, types_1.STARTING_SECTOR.y + types_1.STARTING_SECTOR.height), overrides = {}) {
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
    };
}
function createInitialSnapshot() {
    // Seed the world with mature adults so the colony can begin reproducing once fed,
    // rather than waiting a maturity cycle before any births are possible.
    const creatures = Array.from({ length: 12 }, (_, index) => createCreature(index, 1, undefined, undefined, { age: randomBetween(exports.REPRODUCTION_MIN_AGE_MS, exports.REPRODUCTION_MIN_AGE_MS * 3) }));
    return { creatures, food: [], events: [event('birth', 'World prepared', 'Twelve Mosslings are waiting in the starting sector', 'mint')], births: 0, deaths: 0, generation: 1, startedAt: 0, status: 'stopped' };
}
function tickWorld(snapshot, elapsed) {
    const next = structuredClone(snapshot);
    const consumed = new Set();
    const deaths = [];
    next.creatures = next.creatures.flatMap((creature) => {
        const target = next.food.filter((item) => !consumed.has(item.id)).sort((a, b) => Math.hypot(a.x - creature.x, a.y - creature.y) - Math.hypot(b.x - creature.x, b.y - creature.y))[0];
        const nextCreature = creature;
        nextCreature.age += elapsed;
        nextCreature.pulse += elapsed * 0.005;
        if (nextCreature.reproductionCooldown > 0)
            nextCreature.reproductionCooldown = Math.max(0, nextCreature.reproductionCooldown - elapsed);
        // Gradual, time-based hunger: full energy lasts ~5 real days at rest.
        nextCreature.energy -= elapsed * exports.BASE_METABOLISM * (1 + nextCreature.speed * exports.MOVE_METABOLISM);
        const distanceToTarget = target ? Math.hypot(target.x - nextCreature.x, target.y - nextCreature.y) : Infinity;
        nextCreature.state = target && distanceToTarget < SEEK_RANGE ? 'seeking_food' : 'wandering';
        const desiredAngle = nextCreature.state === 'seeking_food' && target
            ? Math.atan2(target.y - nextCreature.y, target.x - nextCreature.x)
            : nextCreature.angle + stableWander(nextCreature.id, nextCreature.pulse);
        const edgePadding = 520;
        const edgeSteering = (nextCreature.x < types_1.WORLD_MARGIN + edgePadding ? 1 : nextCreature.x > types_1.WORLD_WIDTH - types_1.WORLD_MARGIN - edgePadding ? -1 : 0) * Math.PI * 0.0008
            + (nextCreature.y < types_1.WORLD_MARGIN + edgePadding ? 1 : nextCreature.y > types_1.WORLD_HEIGHT - types_1.WORLD_MARGIN - edgePadding ? -1 : 0) * Math.PI * 0.0008;
        const turn = clamp(angleDelta(nextCreature.angle, desiredAngle) + edgeSteering, -MAX_TURN_PER_MS * elapsed, MAX_TURN_PER_MS * elapsed);
        nextCreature.angle += turn;
        nextCreature.x = clamp(nextCreature.x + Math.cos(nextCreature.angle) * nextCreature.speed * elapsed * MOVEMENT_SCALE, types_1.WORLD_MARGIN, types_1.WORLD_WIDTH - types_1.WORLD_MARGIN);
        nextCreature.y = clamp(nextCreature.y + Math.sin(nextCreature.angle) * nextCreature.speed * elapsed * MOVEMENT_SCALE, types_1.WORLD_MARGIN, types_1.WORLD_HEIGHT - types_1.WORLD_MARGIN);
        if (target && Math.hypot(target.x - nextCreature.x, target.y - nextCreature.y) < EAT_DISTANCE) {
            consumed.add(target.id);
            nextCreature.state = 'eating';
            nextCreature.energy = clamp(nextCreature.energy + exports.FOOD_ENERGY, 0, exports.ENERGY_MAX);
            nextCreature.eaten += 1;
            nextCreature.lastAteAt = nextCreature.age;
            next.events.unshift(event('feed', 'Food consumed', `${speciesName(nextCreature)} restored ${exports.FOOD_ENERGY} energy`, 'amber'));
        }
        if (nextCreature.energy <= 0 || nextCreature.age >= exports.MAX_AGE_MS) {
            deaths.push(nextCreature);
            return [];
        }
        return nextCreature;
    });
    next.food = next.food.filter((item) => !consumed.has(item.id) && item.age + elapsed < exports.FOOD_LIFETIME).map((item) => ({ ...item, age: item.age + elapsed }));
    regenerateFood(next, elapsed);
    next.deaths += deaths.length;
    if (deaths.length)
        next.events.unshift(...deaths.slice(0, 2).map((dead) => event('death', 'Life returned to soil', `${speciesName(dead)} died after ${Math.floor(dead.age / 1000)} sec`, 'coral')));
    next.events = next.events.slice(0, 8);
    return maybeReproduce(next);
}
// Continuously top the world up toward a standing food supply, spawning near living
// creatures so meals stay reachable and the ecosystem can sustain itself.
function regenerateFood(snapshot, elapsed) {
    const deficit = exports.FOOD_TARGET - snapshot.food.length;
    if (deficit <= 0)
        return;
    // One probabilistic spawn opportunity per tick keeps regeneration gradual at the
    // server's 50 ms cadence, while large deterministic test steps can catch up.
    const spawns = Math.min(deficit, elapsed >= 1000 ? Math.max(1, Math.floor(elapsed * exports.FOOD_REGEN_PER_MS)) : (Math.random() < elapsed * exports.FOOD_REGEN_PER_MS ? 1 : 0));
    for (let i = 0; i < spawns; i += 1) {
        const anchor = snapshot.creatures.length ? snapshot.creatures[Math.floor(Math.random() * snapshot.creatures.length)] : null;
        const baseX = anchor ? anchor.x : types_1.STARTING_SECTOR.x + types_1.STARTING_SECTOR.width / 2;
        const baseY = anchor ? anchor.y : types_1.STARTING_SECTOR.y + types_1.STARTING_SECTOR.height / 2;
        let x = baseX;
        let y = baseY;
        for (let attempt = 0; attempt < 8; attempt += 1) {
            x = clamp(baseX + randomBetween(-exports.FOOD_SPAWN_RADIUS, exports.FOOD_SPAWN_RADIUS), types_1.WORLD_MARGIN, types_1.WORLD_WIDTH - types_1.WORLD_MARGIN);
            y = clamp(baseY + randomBetween(-exports.FOOD_SPAWN_RADIUS, exports.FOOD_SPAWN_RADIUS), types_1.WORLD_MARGIN, types_1.WORLD_HEIGHT - types_1.WORLD_MARGIN);
            if (snapshot.creatures.every((creature) => Math.hypot(creature.x - x, creature.y - y) > EAT_DISTANCE * 2))
                break;
        }
        snapshot.food.push({ id: id('food'), x, y, age: 0 });
    }
}
function addFood(snapshot, x, y) {
    const next = structuredClone(snapshot);
    next.food.push({ id: id('food'), x: clamp(x, 0, types_1.WORLD_WIDTH), y: clamp(y, 0, types_1.WORLD_HEIGHT), age: 0 });
    next.events.unshift(event('feed', 'Food placed', 'A visitor changed the ecosystem', 'amber'));
    next.events = next.events.slice(0, 8);
    return next;
}
function mutateCreature(snapshot) {
    const next = structuredClone(snapshot);
    const creature = next.creatures[Math.floor(Math.random() * next.creatures.length)];
    if (!creature)
        return next;
    creature.hue = 20 + Math.random() * 150;
    creature.scale = clamp(creature.scale + 0.1, 0.6, 1.8);
    creature.pulse = 0;
    next.events.unshift(event('mutation', 'Mutation triggered', 'A new trait is moving through the dark', 'coral'));
    next.events = next.events.slice(0, 8);
    return next;
}
// A creature may reproduce once it is mature, off cooldown and well fed.
function canReproduce(creature) {
    return creature.age >= exports.REPRODUCTION_MIN_AGE_MS && creature.reproductionCooldown <= 0 && creature.energy >= exports.REPRODUCTION_MIN_ENERGY;
}
function maybeReproduce(snapshot) {
    const next = structuredClone(snapshot);
    if (next.creatures.length < 2 || next.creatures.length >= MAX_CREATURES)
        return next;
    const used = new Set();
    const newborns = [];
    for (let index = 0; index < next.creatures.length; index += 1) {
        if (next.creatures.length + newborns.length >= MAX_CREATURES)
            break;
        const parent = next.creatures[index];
        if (used.has(parent.id) || !canReproduce(parent))
            continue;
        const partner = next.creatures.slice(index + 1).find((candidate) => !used.has(candidate.id) && canReproduce(candidate) && Math.hypot(candidate.x - parent.x, candidate.y - parent.y) < exports.REPRODUCTION_DISTANCE);
        if (!partner)
            continue;
        used.add(parent.id);
        used.add(partner.id);
        const generation = Math.max(parent.generation, partner.generation) + 1;
        parent.energy = Math.max(0, parent.energy - exports.REPRODUCTION_ENERGY_COST);
        partner.energy = Math.max(0, partner.energy - exports.REPRODUCTION_ENERGY_COST);
        parent.reproductionCooldown = exports.REPRODUCTION_COOLDOWN_MS;
        partner.reproductionCooldown = exports.REPRODUCTION_COOLDOWN_MS;
        parent.state = 'reproducing';
        partner.state = 'reproducing';
        const childHue = clamp((parent.hue + partner.hue) / 2 + randomBetween(-8, 8), 20, 150);
        const childScale = clamp((parent.scale + partner.scale) / 2 + randomBetween(-0.05, 0.05), 0.6, 1.8);
        newborns.push(createCreature(next.creatures.length + newborns.length, generation, clamp((parent.x + partner.x) / 2 + randomBetween(-40, 40), types_1.WORLD_MARGIN, types_1.WORLD_WIDTH - types_1.WORLD_MARGIN), clamp((parent.y + partner.y) / 2 + randomBetween(-40, 40), types_1.WORLD_MARGIN, types_1.WORLD_HEIGHT - types_1.WORLD_MARGIN), { energy: exports.NEWBORN_ENERGY, reproductionCooldown: exports.REPRODUCTION_COOLDOWN_MS, hue: childHue, scale: childScale }));
        next.births += 1;
        next.generation = Math.max(next.generation, generation);
        next.events.unshift(event('birth', 'New life', `Mossling · generation ${generation}`, 'mint'));
    }
    if (newborns.length) {
        next.creatures.push(...newborns);
        next.events = next.events.slice(0, 8);
    }
    return next;
}
function speciesName(creature) { return SPECIES[creature.generation % SPECIES.length] ?? 'Mossling'; }
