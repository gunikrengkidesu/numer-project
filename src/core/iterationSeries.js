import { fmt } from './utils.js'

// แปลงผลลัพธ์ (rows ของแต่ละ iteration) เป็นข้อมูลกราฟ — เลือกพล็อตเฉพาะ "จุดสำคัญ"
// รูปแบบ: { xLabel, yLabel, zero, curve?, xRange?, series: [{ name, points: [{ x, y, lines[] }] }] }
const ITER_X_KEYS = ['c', 'x new', 'x(i+1)', 'g(x)', 'x'] // คอลัมน์ที่เป็น "ค่า x ที่ได้ในรอบนั้น"

// จุดสำคัญ: เริ่มต้น, 2 รอบถัดมา, ช่วง 25/50/75%, รอบรองสุดท้าย และผลลัพธ์ (ไม่เกิน 8 จุด)
export function keyIndexes(n) {
  if (n <= 8) return [...Array(n).keys()]
  const r = f => Math.round((n - 1) * f)
  return [...new Set([0, 1, 2, r(0.25), r(0.5), r(0.75), n - 2, n - 1])].sort((a, b) => a - b)
}
const tag = (k, count) => (k === count - 1 ? ' (ผลลัพธ์)' : k === 0 ? ' (เริ่มต้น)' : '')

function rootChart(res) {
  const base = { xLabel: 'x', yLabel: 'f(x)', zero: true, curve: { f: res.f } }
  if (res.all) { // Graphical: จุดสำคัญคือรากที่พบ
    const points = res.all.filter(isFinite).map((x, k) => ({ x, y: res.f(x), lines: [`ราก #${k + 1}`, `x = ${fmt(x, 8)}`, `f(x) = ${fmt(res.f(x), 8)}`] }))
    return { ...base, xRange: [+res.p.a, +res.p.b], series: [{ name: 'ราก', points }] }
  }
  const key = ITER_X_KEYS.find(k => k in (res.rows[0] ?? {}))
  if (!key) return null
  const rows = keyIndexes(res.rows.length).map(i => res.rows[i])
  const points = rows.map((row, k) => {
    const x = row[key], y = res.f(x), err = row['error %']
    return { x, y, lines: [`Iteration ${row.i}${tag(k, rows.length)}`, `x = ${fmt(x, 8)}`, `f(x) = ${fmt(y, 8)}`, ...(isFinite(err) ? [`error = ${fmt(err, 6)} %`] : [])] }
  }).filter(p => isFinite(p.x) && isFinite(p.y))
  return points.length ? { ...base, series: [{ name: 'f(x)', points }] } : null
}

function linearChart(res) {
  const keys = Object.keys(res.rows[0]).filter(k => /^x\d+$/.test(k))
  const rows = keyIndexes(res.rows.length).map(i => res.rows[i])
  const series = keys.map(k => ({
    name: k,
    points: rows.filter(r => isFinite(r[k])).map((r, j) => ({ x: r.i, y: r[k], lines: [`Iteration ${r.i}${tag(j, rows.length)}`, `${k} = ${fmt(r[k], 8)}`, `error = ${fmt(r.error, 6)}`] }))
  }))
  return series.length && series[0].points.length ? { xLabel: 'iteration', yLabel: 'x', zero: false, series } : null
}

export function buildChart(res) {
  if (!res?.rows?.length) return null
  if (res.kind === 'root') return rootChart(res)
  if (res.kind === 'linear' && !res.direct) return linearChart(res)
  return null
}
