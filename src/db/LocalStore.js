import { HistoryStore } from './HistoryStore.js'

export class LocalStore extends HistoryStore {
  constructor(key = 'nm_history') { super(); this.key = key; this.cbs = [] }
  load() { try { return JSON.parse(localStorage.getItem(this.key) || '[]') } catch { return [] } }
  save(list) { localStorage.setItem(this.key, JSON.stringify(list)); this.cbs.forEach(cb => cb(list)) }
  async add(rec) { this.save([{ id: 'h_' + rec.ts, ...rec }, ...this.load()].slice(0, 200)) }
  async remove(id) { this.save(this.load().filter(h => h.id !== id)) }
  async clear() { this.save([]) }
  subscribe(cb) { this.cbs.push(cb); cb(this.load()) }
}
