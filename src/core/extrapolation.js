import { CubicSpline, PointMethod } from './interpolation.js'
import { parsePoints } from './points.js'

export class SplineExtrapolation extends PointMethod {
  solve() {
    if (this.inRange) this.warn = 'x อยู่ในช่วงข้อมูล (เป็น interpolation)'
    const s = new CubicSpline(this.xs, this.ys)
    return this.done(x => s.eval(x), s.segments(), ['ต่อพหุนามของช่วงปลายสุด/ช่วงแรกออกไปนอกข้อมูล'])
  }
}

// Multiple linear regression: ŷ = b0 + b1·x1 + … + bk·xk (Normal equations)
export class MultipleRegression {
  static input = 'multi'
  static fields = [['xq', 'ค่า x₁ x₂ … ที่ต้องการทำนาย (คั่นด้วยช่องว่าง)', '4 1']]
  constructor(p) {
    this.rows = parsePoints(p.pts); this.k = this.rows[0].length - 1
    if (this.k < 1) throw new Error('ต้องมีอย่างน้อย 1 ตัวแปร x และ 1 คอลัมน์ y')
    if (this.rows.length < this.k + 1) throw new Error(`ต้องมีข้อมูลอย่างน้อย ${this.k + 1} แถว`)
    this.xq = p.xq.trim().split(/[\s,]+/).map(Number)
    if (this.xq.length !== this.k || this.xq.some(isNaN)) throw new Error(`ต้องระบุค่า x จำนวน ${this.k} ค่า`)
  }
  static solve(A, b) { // Gauss elimination + partial pivoting
    const n = b.length, M = A.map((r, i) => [...r, b[i]])
    for (let k = 0; k < n; k++) {
      let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i
      if (Math.abs(M[p][k]) < 1e-12) throw new Error('ข้อมูลทำให้หาสัมประสิทธิ์ไม่ได้ (ตัวแปรขึ้นต่อกัน หรือข้อมูลไม่พอ)');
      [M[k], M[p]] = [M[p], M[k]]
      for (let i = k + 1; i < n; i++) { const f = M[i][k] / M[k][k]; for (let j = k; j <= n; j++) M[i][j] -= f * M[k][j] }
    }
    const x = []
    for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i] }
    return x
  }
  solve() {
    const k = this.k, X = this.rows.map(r => [1, ...r.slice(0, k)]), y = this.rows.map(r => r[k]), m = k + 1
    const XtX = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0)))
    const Xty = Array.from({ length: m }, (_, i) => X.reduce((s, r, t) => s + r[i] * y[t], 0))
    const beta = MultipleRegression.solve(XtX, Xty), pred = r => r.reduce((s, v, i) => s + v * beta[i], 0)
    const yhat = X.map(pred), mean = y.reduce((s, v) => s + v, 0) / y.length
    const sse = y.reduce((s, v, i) => s + (v - yhat[i]) ** 2, 0), sst = y.reduce((s, v) => s + (v - mean) ** 2, 0)
    const rows = this.rows.map((r, i) => { const o = { i: i + 1 }; r.slice(0, k).forEach((v, j) => (o['x' + (j + 1)] = v)); o.y = y[i]; o['ŷ'] = yhat[i]; o.residual = y[i] - yhat[i]; return o })
    const value = pred([1, ...this.xq]), cols = Array.from({ length: k }, (_, j) => this.rows.map(r => r[j]))
    const inside = this.xq.every((v, j) => v >= Math.min(...cols[j]) && v <= Math.max(...cols[j]))
    const res = {
      kind: 'value', label: `ŷ(${this.xq.join(', ')})`, value, rows, warn: inside ? 'ค่า x อยู่ในช่วงข้อมูลทั้งหมด (เป็น interpolation)' : '',
      notes: ['b = [' + beta.map(v => +v.toFixed(6)).join(', ') + ']  (b₀ = intercept)', 'R² = ' + (sst ? +(1 - sse / sst).toFixed(6) : 1)]
    }
    if (k === 1) { const xs = cols[0], lo = Math.min(...xs, this.xq[0]), hi = Math.max(...xs, this.xq[0]), mg = (hi - lo) * 0.1 || 1
      res.plot = { f: x => beta[0] + beta[1] * x, a: lo - mg, b: hi + mg, points: xs.map((x, i) => [x, y[i]]), mark: [this.xq[0], value] } }
    return res
  }
}
