// ทดสอบ API กับ PostgreSQL จริง (ตั้ง TEST_DATABASE_URL ได้) — ถ้าเชื่อมต่อไม่ได้จะข้าม
import { createPool, initSchema, DEFAULT_URL } from '../server/db.js'
import { createApp, MAX_PER_CLIENT } from '../server/app.js'
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m) }
const pool = createPool(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? DEFAULT_URL)
try { await initSchema(pool) } catch (e) { console.log('api test skipped (PostgreSQL ไม่พร้อม):', e.code ?? e.message); await pool.end(); process.exit(0) }
const A = 'test-client-aaaa', B = 'test-client-bbbb'
await pool.query('DELETE FROM history WHERE client_id = ANY($1)', [[A, B]])
const server = createApp(pool).listen(0), base = `http://localhost:${server.address().port}/api/history`
const call = (cid, path = '', method = 'GET', body) => fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(cid && { 'X-Client-Id': cid }) }, body: body && JSON.stringify(body) })
const rec = (ts, extra = {}) => ({ ts, cat: 'Root of Equation', method: 'Bisection', input: JSON.stringify({ fx: 'x^3-x-2', a: '1', b: '2' }), summary: 'root ≈ 1.52138', ...extra })
try {
  ok((await call(null)).status === 400, 'needs client id')
  ok((await call(A, '', 'POST', rec(1, { input: 'not json' }))).status === 400, 'bad input json')
  ok((await call(A, '', 'POST', rec(1, { cat: '' }))).status === 400, 'empty cat')
  const created = await call(A, '', 'POST', rec(1000)); ok(created.status === 201, 'create')
  const { id } = await created.json()
  const list = await (await call(A)).json()
  ok(list.length === 1 && list[0].id === id && list[0].ts === 1000, 'list own')
  ok(JSON.parse(list[0].input).fx === 'x^3-x-2' && typeof list[0].input === 'string', 'input returned as JSON string')
  ok((await (await call(B)).json()).length === 0, 'isolated per client')
  await call(B, '/' + id, 'DELETE'); ok((await (await call(A)).json()).length === 1, 'cannot delete others')
  ok((await call(A, '/xyz', 'DELETE')).status === 400, 'invalid id')
  ok((await call(A, '/' + id, 'DELETE')).status === 204 && (await (await call(A)).json()).length === 0, 'delete')
  for (let i = 0; i < MAX_PER_CLIENT + 5; i++) await call(A, '', 'POST', rec(2000 + i))
  const all = await (await call(A)).json()
  ok(all.length === MAX_PER_CLIENT && all[0].ts === 2000 + MAX_PER_CLIENT + 4, 'prune keeps latest ' + MAX_PER_CLIENT)
  await call(A, '', 'DELETE'); ok((await (await call(A)).json()).length === 0, 'clear')
  console.log('api tests passed')
} finally { server.close(); await pool.query('DELETE FROM history WHERE client_id = ANY($1)', [[A, B]]); await pool.end() }
