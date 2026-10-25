import pg from 'pg'
import { readFileSync } from 'node:fs'

export const DEFAULT_URL = 'postgres://postgres:postgres@localhost:5432/numerical'
export const createPool = (url = (process.env.DATABASE_URL || '').trim() || DEFAULT_URL) => new pg.Pool({ connectionString: url }) // ค่าว่างถือว่าไม่ได้ตั้ง
export const initSchema = pool => pool.query(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'))