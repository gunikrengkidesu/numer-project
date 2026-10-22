import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createPool, initSchema } from './db.js'
import { createApp } from './app.js'

const pool = createPool()
await initSchema(pool) // สร้างตารางอัตโนมัติถ้ายังไม่มี
const port = process.env.PORT ?? 3000
const dist = fileURLToPath(new URL('../dist', import.meta.url))
const app = createApp(pool, existsSync(dist) ? dist : undefined)
if (!existsSync(dist)) app.get('/', (req, res) => res.status(503).type('text').send('ยังไม่มีโฟลเดอร์ dist — รัน "npm run build" ก่อน (หรือใช้ "npm start") ถ้าต้องการพัฒนา ให้เปิด http://localhost:5173 ด้วย "npm run dev"'))
app.listen(port, () => console.log(`API → http://localhost:${port}` + (existsSync(dist) ? ' (เสิร์ฟเว็บจาก dist ด้วย)' : ' (ยังไม่ได้ build เว็บ)')))
