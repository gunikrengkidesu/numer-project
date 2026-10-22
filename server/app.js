import express from 'express'

export const MAX_PER_CLIENT = 200
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const str = (v, max, min = 1) => typeof v === 'string' && v.length >= min && v.length <= max

// ตรวจข้อมูลที่ client ส่งมา แล้วคืนค่าที่สะอาด (หรือ null ถ้าไม่ถูกต้อง)
function validate(b) {
  if (!b || !Number.isSafeInteger(b.ts) || !str(b.cat, 64) || !str(b.method, 64) || !str(b.input, 20000) || !str(b.summary ?? '', 500, 0)) return null
  try { const j = JSON.parse(b.input); if (!j || typeof j !== 'object') return null } catch { return null }
  return { ts: b.ts, cat: b.cat, method: b.method, input: b.input, summary: b.summary ?? '' }
}

export function createApp(pool, staticDir) {
  const app = express()
  app.use(express.json({ limit: '100kb' }))
  const wrap = fn => (req, res, next) => fn(req, res).catch(next)

  app.use('/api', (req, res, next) => { // ระบุผู้ใช้ด้วย X-Client-Id (ไม่มีระบบล็อกอิน)
    const id = req.get('x-client-id')
    if (!id || !/^[\w-]{8,64}$/.test(id)) return res.status(400).json({ error: 'missing or invalid X-Client-Id' })
    req.clientId = id; next()
  })

  app.get('/api/history', wrap(async (req, res) => {
    const { rows } = await pool.query('SELECT id, ts, cat, method, input, summary FROM history WHERE client_id = $1 ORDER BY ts DESC LIMIT $2', [req.clientId, MAX_PER_CLIENT])
    res.json(rows.map(r => ({ id: r.id, ts: Number(r.ts), cat: r.cat, method: r.method, input: JSON.stringify(r.input), summary: r.summary })))
  }))

  app.post('/api/history', wrap(async (req, res) => {
    const v = validate(req.body)
    if (!v) return res.status(400).json({ error: 'invalid body' })
    const { rows } = await pool.query('INSERT INTO history (client_id, ts, cat, method, input, summary) VALUES ($1, $2, $3, $4, $5::jsonb, $6) RETURNING id', [req.clientId, v.ts, v.cat, v.method, v.input, v.summary])
    await pool.query('DELETE FROM history WHERE client_id = $1 AND id NOT IN (SELECT id FROM history WHERE client_id = $1 ORDER BY ts DESC LIMIT $2)', [req.clientId, MAX_PER_CLIENT])
    res.status(201).json({ id: rows[0].id })
  }))

  app.delete('/api/history/:id', wrap(async (req, res) => {
    if (!UUID.test(req.params.id)) return res.status(400).json({ error: 'invalid id' })
    await pool.query('DELETE FROM history WHERE id = $1 AND client_id = $2', [req.params.id, req.clientId])
    res.status(204).end()
  }))

  app.delete('/api/history', wrap(async (req, res) => {
    await pool.query('DELETE FROM history WHERE client_id = $1', [req.clientId])
    res.status(204).end()
  }))

  if (staticDir) app.use(express.static(staticDir)) // production: เสิร์ฟไฟล์จาก dist/
  app.use((err, req, res, next) => { console.error(err); res.status(err.status === 400 || err.type?.startsWith('entity') ? 400 : 500).json({ error: 'request failed' }) })
  return app
}
