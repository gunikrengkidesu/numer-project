import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createPool, initSchema } from './db.js'
import { createApp } from './app.js'

// ตรวจ DATABASE_URL ก่อนต่อฐานข้อมูล (ค่าว่างหรือไม่ได้ตั้ง จะไปต่อ localhost ซึ่งบน Render ไม่มี)
const dbUrl = (process.env.DATABASE_URL || '').trim()
if (!dbUrl && process.env.RENDER) {
  console.error('ไม่พบ DATABASE_URL — ไปที่ Render > เว็บเซอร์วิส > Environment แล้วเพิ่ม DATABASE_URL เป็น Internal Database URL ของฐานข้อมูล แล้ว Save')
  process.exit(1)
}
try { console.log('DATABASE_URL:', dbUrl ? `ตั้งแล้ว (host: ${new URL(dbUrl).host})` : 'ไม่ได้ตั้ง → ใช้ localhost') } catch { console.error('DATABASE_URL รูปแบบไม่ถูกต้อง (ต้องขึ้นต้นด้วย postgresql://)'); process.exit(1) }
const pool = createPool(dbUrl || undefined)
await initSchema(pool) // สร้างตารางอัตโนมัติถ้ายังไม่มี
const port = process.env.PORT ?? 3000
const dist = fileURLToPath(new URL('../dist', import.meta.url))
const app = createApp(pool, existsSync(dist) ? dist : undefined)
if (!existsSync(dist)) app.get('/', (req, res) => res.status(503).type('text').send('ยังไม่มีโฟลเดอร์ dist — รัน "npm run build" ก่อน (หรือใช้ "npm start") ถ้าต้องการพัฒนา ให้เปิด http://localhost:5173 ด้วย "npm run dev"'))
app.listen(port, () => console.log(`API → http://localhost:${port}` + (existsSync(dist) ? ' (เสิร์ฟเว็บจาก dist ด้วย)' : ' (ยังไม่ได้ build เว็บ)')))