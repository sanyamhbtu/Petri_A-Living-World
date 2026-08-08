"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const FOOD_LIFETIME = 90_000;
const STARVATION_MS = 42_000;
const MAX_AGE_MS = 12 * 60_000;
const REPRODUCTION_COOLDOWN_MS = 36_000;
const EAT_DISTANCE = 34;
function id(prefix) { return `${prefix}-${Math.random().toString(36).slice(2, 10)}`; }
function randomBetween(min, max) { return min + Math.random() * (max - min); }
function event(kind, title, detail, color) { return { id: Date.now() + Math.floor(Math.random() * 1000), kind, title, detail, time: 'now', color }; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function createCreature(index, generation = 1, x = randomBetween(types_1.STARTING_SECTOR.x, types_1.STARTING_SECTOR.x + types_1.STARTING_SECTOR.width), y = randomBetween(types_1.STARTING_SECTOR.y, types_1.STARTING_SECTOR.y + types_1.STARTING_SECTOR.height)) {
    return { id: id('creature'), x, y, angle: Math.random() * Math.PI * 2, hue: 92 + Math.random() * 34, scale: 0.82 + Math.random() * 0.35, speed: 0.45 + Math.random() * 0.35, generation, state: 'wandering', pulse: Math.random() * Math.PI * 2, energy: randomBetween(72, 100), age: 0, eaten: 0, lastAteAt: 0 };
}
function createInitialSnapshot() {
    const creatures = Array.from({ length: 12 }, (_, index) => createCreature(index));
    return { creatures, food: [], events: [event('birth', 'World prepared', 'Twelve Mosslings are waiting in the starting sector', 'mint')], births: 0, deaths: 0, generation: 1, startedAt: 0, status: 'stopped' };
}
function tickWorld(snapshot, elapsed) {
    const next = structuredClone(snapshot);
    const now = (snapshot.startedAt || Date.now()) + elapsed;
    const consumed = new Set();
    const deaths = [];
    next.creatures = next.creatures.flatMap((creature) => {
        const target = next.food.filter((item) => !consumed.has(item.id)).sort((a, b) => Math.hypot(a.x - creature.x, a.y - creature.y) - Math.hypot(b.x - creature.x, b.y - creature.y))[0];
        const nextCreature = creature;
        nextCreature.age += elapsed;
        nextCreature.pulse += elapsed * 0.005;
        nextCreature.energy -= elapsed * (0.004 + nextCreature.speed * 0.0015);
        nextCreature.state = target && Math.hypot(target.x - nextCreature.x, target.y - nextCreature.y) < 680 ? 'seeking_food' : 'wandering';
        if (target && nextCreature.state === 'seeking_food')
            nextCreature.angle = Math.atan2(target.y - nextCreature.y, target.x - nextCreature.x);
        else
            nextCreature.angle += (Math.random() - 0.5) * 0.08;
        const edgePadding = 520;
        if (nextCreature.x < types_1.WORLD_MARGIN + edgePadding || nextCreature.x > types_1.WORLD_WIDTH - types_1.WORLD_MARGIN - edgePadding)
            nextCreature.angle = Math.PI - nextCreature.angle;
        if (nextCreature.y < types_1.WORLD_MARGIN + edgePadding || nextCreature.y > types_1.WORLD_HEIGHT - types_1.WORLD_MARGIN - edgePadding)
            nextCreature.angle = -nextCreature.angle;
        nextCreature.x = clamp(nextCreature.x + Math.cos(nextCreature.angle) * nextCreature.speed * elapsed * 0.022, types_1.WORLD_MARGIN, types_1.WORLD_WIDTH - types_1.WORLD_MARGIN);
        nextCreature.y = clamp(nextCreature.y + Math.sin(nextCreature.angle) * nextCreature.speed * elapsed * 0.022, types_1.WORLD_MARGIN, types_1.WORLD_HEIGHT - types_1.WORLD_MARGIN);
        if (target && Math.hypot(target.x - nextCreature.x, target.y - nextCreature.y) < EAT_DISTANCE) {
            consumed.add(target.id);
            nextCreature.state = 'eating';
            nextCreature.energy = clamp(nextCreature.energy + 42, 0, 100);
            nextCreature.eaten += 1;
            nextCreature.lastAteAt = now;
        }
        if (nextCreature.energy <= 0 || nextCreature.age >= MAX_AGE_MS) {
            deaths.push(nextCreature);
            return [];
        }
        return nextCreature;
    });
    next.food = next.food.filter((item) => !consumed.has(item.id) && item.age + elapsed < FOOD_LIFETIME).map((item) => ({ ...item, age: item.age + elapsed }));
    next.deaths += deaths.length;
    if (deaths.length)
        next.events.unshift(...deaths.slice(0, 2).map((dead) => event('death', 'Life returned to soil', `${speciesName(dead)} died after ${Math.floor(dead.age / 1000)} sec`, 'coral')));
    next.events = next.events.slice(0, 8);
    return maybeReproduce(next, now);
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
function maybeReproduce(snapshot, now = Date.now()) {
    const next = structuredClone(snapshot);
    if (next.creatures.length >= MAX_CREATURES || next.creatures.length < 2 || Math.random() > 0.02)
        return next;
    for (let index = 0; index < next.creatures.length; index += 1) {
        const parent = next.creatures[index];
        const partner = next.creatures.slice(index + 1).find((candidate) => Math.hypot(candidate.x - parent.x, candidate.y - parent.y) < 190 && candidate.lastAteAt > 0 && now - candidate.lastAteAt < REPRODUCTION_COOLDOWN_MS && now - parent.lastAteAt < REPRODUCTION_COOLDOWN_MS);
        if (!partner)
            continue;
        const generation = Math.max(parent.generation, partner.generation) + 1;
        next.creatures.push(createCreature(next.creatures.length, generation, clamp((parent.x + partner.x) / 2 + randomBetween(-40, 40), types_1.WORLD_MARGIN, types_1.WORLD_WIDTH - types_1.WORLD_MARGIN), clamp((parent.y + partner.y) / 2 + randomBetween(-40, 40), types_1.WORLD_MARGIN, types_1.WORLD_HEIGHT - types_1.WORLD_MARGIN)));
        parent.energy = Math.max(0, parent.energy - 18);
        partner.energy = Math.max(0, partner.energy - 18);
        next.births += 1;
        next.generation = Math.max(next.generation, generation);
        next.events.unshift(event('reproduction', 'New life', `Mossling · generation ${generation}`, 'mint'));
        next.events = next.events.slice(0, 8);
        break;
    }
    return next;
}
function speciesName(creature) { return SPECIES[creature.generation % SPECIES.length] ?? 'Mossling'; }
