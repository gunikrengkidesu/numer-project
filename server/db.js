import pg from 'pg'
import { readFileSync } from 'node:fs'

export const DEFAULT_URL = 'postgresql://numerical_db_user:Tn7IhVL2kUJPooctFDejAjw04uHt3xnF@dpg-dbess58m7kps73evn47g-a/numerical_db'
export const createPool = (url = (process.env.DATABASE_URL || '').trim() || DEFAULT_URL) => new pg.Pool({ connectionString: url }) // ค่าว่างถือว่าไม่ได้ตั้ง
export const initSchema = pool => pool.query(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'))