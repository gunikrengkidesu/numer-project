import { HistoryStore } from './HistoryStore.js'

// ใช้เมื่อมี backend (Express + SQLite/PostgreSQL) — สลับใน db/index.js ได้ทันที
export class ApiStore extends HistoryStore {
  constructor(base = '/api/history') { super(); this.base = base; this.cbs = [] }
  async refresh() { const r = await fetch(this.base); const l = await r.json(); this.cbs.forEach(cb => cb(l)) }
  async add(rec) { await fetch(this.base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rec) }); await this.refresh() }
  async remove(id) { await fetch(`${this.base}/${id}`, { method: 'DELETE' }); await this.refresh() }
  async clear() { await fetch(this.base, { method: 'DELETE' }); await this.refresh() }
  subscribe(cb) { this.cbs.push(cb); this.refresh() }
}
