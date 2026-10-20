const grid = (n, f) => Array.from({ length: n }, (_, i) => f(i))
export const defaultMatrix = () => ({ n: 3, A: [['4', '1', '1'], ['1', '5', '2'], ['1', '2', '6']], b: ['6', '8', '9'], x0: ['', '', ''] })

export function resizeMatrix(m, n) {
  n = Math.max(2, Math.min(8, parseInt(n) || 3))
  return { n, A: grid(n, i => grid(n, j => m.A[i]?.[j] ?? '')), b: grid(n, i => m.b[i] ?? ''), x0: grid(n, i => m.x0[i] ?? '') }
}
const z = v => (String(v).trim() === '' ? '0' : String(v).trim())
// แปลงเป็นข้อความที่คลาส LinearMethod อ่านได้
export function serializeMatrix(m) {
  return { A: m.A.map(r => r.map(z).join(' ')).join('\n'), b: m.b.map(z).join(' '), x0: m.x0.every(v => String(v).trim() === '') ? '' : m.x0.map(z).join(' ') }
}
export function parseMatrix(p) {
  const sp = s => s.trim().split(/[\s,]+/), b = sp(p.b), n = b.length
  const x0 = p.x0.trim() ? sp(p.x0) : []
  while (x0.length < n) x0.push('')
  return { n, A: p.A.trim().split(/\n+/).map(sp), b, x0 }
}
