import { fmt } from './utils.js'

// แปลงผลลัพธ์ (rows ของแต่ละ iteration) เป็นข้อมูลสำหรับกราฟ
// รูปแบบ: { xLabel, yLabel, zero, series: [{ name, points: [{ x, y, lines[] }] }] }
const ITER_X_KEYS = ['c', 'x new', 'x(i+1)', 'g(x)', 'x'] // คอลัมน์ที่เป็น "ค่า x ที่ได้ในรอบนั้น"

function rootChart(res) {
  const key = ITER_X_KEYS.find(k => k in (res.rows[0] ?? {}))
  if (!key) return null
  const points = res.rows.map(row => {
    const x = row[key], y = res.f(x), err = row['error %']
    return { x, y, lines: [`Iteration ${row.i}`, `x = ${fmt(x, 8)}`, `f(x) = ${fmt(y, 8)}`, ...(isFinite(err) ? [`error = ${fmt(err, 6)} %`] : [])] }
  }).filter(p => isFinite(p.x) && isFinite(p.y))
  return points.length ? { xLabel: 'x', yLabel: 'f(x)', zero: true, curve: { f: res.f }, series: [{ name: 'f(x)', points }] } : null
}

function linearChart(res) {
  const keys = Object.keys(res.rows[0]).filter(k => /^x\d+$/.test(k))
  const series = keys.map(k => ({
    name: k,
    points: res.rows.filter(r => isFinite(r[k])).map(r => ({ x: r.i, y: r[k], lines: [`Iteration ${r.i}`, `${k} = ${fmt(r[k], 8)}`, `error = ${fmt(r.error, 6)}`] }))
  }))
  return series.length && series[0].points.length ? { xLabel: 'iteration', yLabel: 'x', zero: false, series } : null
}

export function buildChart(res) {
  if (!res?.rows?.length) return null
  if (res.kind === 'root') return rootChart(res)
  if (res.kind === 'linear' && !res.direct) return linearChart(res)
  return null
}
