import { Redis } from '@upstash/redis'

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

export const isRedisConfigured = Boolean(url && token)
export const redis = isRedisConfigured ? new Redis({ url, token }) : null
export const PETRI_CACHE_KEY = 'petri:world:v1'
export const PETRI_SNAPSHOT_KEY = 'petri:last-neon-snapshot:v1'
