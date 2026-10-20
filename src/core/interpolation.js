import { parsePoints } from './points.js'

// Natural cubic spline: S_j(x) = a + b·dx + c·dx² + d·dx³  (dx = x - x_j)
export class CubicSpline {
  constructor(xs, ys) {
    const n = xs.length, h = [], a = [...ys], c = Array(n).fill(0), b = [], d = [], al = [], l = [1], mu = [0], z = [0]
    for (let i = 0; i < n - 1; i++) h[i] = xs[i + 1] - xs[i]
    for (let i = 1; i < n - 1; i++) {
      al[i] = 3 / h[i] * (a[i + 1] - a[i]) - 3 / h[i - 1] * (a[i] - a[i - 1])
      l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1]
      mu[i] = h[i] / l[i]; z[i] = (al[i] - h[i - 1] * z[i - 1]) / l[i]
    }
    for (let j = n - 2; j >= 0; j--) {
      c[j] = z[j] - mu[j] * c[j + 1]
      b[j] = (a[j + 1] - a[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3
      d[j] = (c[j + 1] - c[j]) / (3 * h[j])
    }
    Object.assign(this, { xs, a, b, c, d })
  }
  eval(x) { // นอกช่วงข้อมูล = ใช้พหุนามของช่วงปลาย (extrapolation)
    const n = this.xs.length; let j = 0
    while (j < n - 2 && x > this.xs[j + 1]) j++
    const dx = x - this.xs[j]
    return this.a[j] + this.b[j] * dx + this.c[j] * dx ** 2 + this.d[j] * dx ** 3
  }
  segments() { return this.xs.slice(0, -1).map((x, j) => ({ segment: j + 1, 'x_i': x, 'x_i+1': this.xs[j + 1], a: this.a[j], b: this.b[j], c: this.c[j], d: this.d[j] })) }
}

// คลาสแม่ของวิธีที่ใช้ข้อมูลจุด (x, y)
export class PointMethod {
  static input = 'points'
  static fields = [['xq', 'x ที่ต้องการหาค่า', '1.5']]
  constructor(p) {
    const rows = parsePoints(p.pts, 2).sort((u, v) => u[0] - v[0])
    this.xs = rows.map(r => r[0]); this.ys = rows.map(r => r[1]); this.n = rows.length; this.xq = +p.xq; this.warn = ''
    if (this.n < 2) throw new Error('ต้องมีอย่างน้อย 2 จุด')
    if (isNaN(this.xq)) throw new Error('ค่า x ที่ต้องการหาไม่ถูกต้อง')
    if (this.xs.some((x, i) => i && x === this.xs[i - 1])) throw new Error('ค่า x ต้องไม่ซ้ำกัน')
    this.inRange = this.xq >= this.xs[0] && this.xq <= this.xs[this.n - 1]
  }
  plot(f, value) {
    const lo = Math.min(this.xs[0], this.xq), hi = Math.max(this.xs[this.n - 1], this.xq), m = (hi - lo) * 0.1 || 1
    return { f, a: lo - m, b: hi + m, points: this.xs.map((x, i) => [x, this.ys[i]]), mark: [this.xq, value] }
  }
  done(f, rows, notes = []) {
    const value = f(this.xq)
    return { kind: 'value', label: `f(${this.xq})`, value, rows, notes, warn: this.warn, plot: this.plot(f, value) }
  }
}
class Interpolation extends PointMethod {
  constructor(p) { super(p); if (!this.inRange) this.warn = 'x อยู่นอกช่วงข้อมูล — ควรใช้หมวด Extrapolation' }
}

export class NewtonInterpolation extends Interpolation { // Newton divided difference
  solve() {
    const { xs, n } = this, T = [this.ys.slice()]
    for (let k = 1; k < n; k++) { T[k] = []; for (let i = 0; i < n - k; i++) T[k][i] = (T[k - 1][i + 1] - T[k - 1][i]) / (xs[i + k] - xs[i]) }
    const coef = T.map(col => col[0])
    const f = x => { let s = 0, pr = 1; for (let k = 0; k < n; k++) { s += coef[k] * pr; pr *= x - xs[k] } return s }
    const rows = xs.map((x, i) => { const r = { i, x }; T.forEach((col, k) => (r[k ? `Δ${k}f` : 'f(x)'] = i < n - k ? col[i] : '')); return r })
    return this.done(f, rows, ['b₀…b' + (n - 1) + ' = ' + coef.map(v => +v.toFixed(6)).join(', '), `พหุนามดีกรี ${n - 1}`])
  }
}
export class LagrangeInterpolation extends Interpolation {
  solve() {
    const { xs, ys, n } = this
    const L = (i, x) => xs.reduce((p, xj, j) => (j === i ? p : p * (x - xj) / (xs[i] - xj)), 1)
    const f = x => ys.reduce((s, y, i) => s + y * L(i, x), 0)
    const rows = xs.map((x, i) => ({ i, x, y: ys[i], 'L_i(xq)': L(i, this.xq), 'y·L_i': ys[i] * L(i, this.xq) }))
    return this.done(f, rows, [`พหุนามดีกรี ${n - 1}`])
  }
}
export class SplineInterpolation extends Interpolation {
  solve() {
    const s = new CubicSpline(this.xs, this.ys)
    return this.done(x => s.eval(x), s.segments(), ['Natural cubic spline (S″ = 0 ที่ปลายทั้งสอง)'])
  }
}
