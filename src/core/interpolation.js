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
  index(x) { const n = this.xs.length; let j = 0; while (j < n - 2 && x > this.xs[j + 1]) j++; return j } // ช่วงที่ใช้ (0-based)
  segments() { return this.xs.slice(0, -1).map((x, j) => ({ segment: j + 1, 'x_i': x, 'x_i+1': this.xs[j + 1], a: this.a[j], b: this.b[j], c: this.c[j], d: this.d[j] })) }
}

// คลาสแม่ของวิธีที่ใช้ข้อมูลจุด (x, y)
export class PointMethod {
  static input = 'points'
  static fields = [['xq', 'x ที่ต้องการหาค่า', '1.5']]
  constructor(p) {
    const raw = parsePoints(p.pts, 2), rows = [...raw].sort((u, v) => u[0] - v[0])
    this.rawXs = raw.map(r => r[0]); this.rawYs = raw.map(r => r[1]) // ลำดับตามที่กรอก
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
    const result = { kind: 'value', label: `f(${this.xq})`, value, rows, notes, warn: this.warn, hideTable: true }
    if (this.showPlot !== false) result.plot = this.plot(f, value)
    return result
  }
}
class Interpolation extends PointMethod {
  constructor(p) { super(p); this.showPlot = false; if (!this.inRange) this.warn = 'x อยู่นอกช่วงข้อมูล — ควรใช้หมวด Extrapolation' }
}

// ตัวช่วยจัดข้อความสำหรับ Solution: เลขตามที่กรอก (ไม่เติมทศนิยม), เครื่องหมายลบ (−), เลขยกกำลัง
const plain = v => (v < 0 ? '−' : '') + Math.abs(v)
const num = v => (v < 0 ? `(−${-v})` : String(v))
const sup = e => String(e).replace(/[-\d]/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹⁻'['0123456789-'.indexOf(c)])
const coefStr = v => { // จำนวนเต็มแสดงเป็นจำนวนเต็ม, เล็กมากแสดงเป็น m * 10ⁿ, ติดลบใส่วงเล็บ
  const a = Math.abs(v); let body
  if (Number.isInteger(v)) body = String(a)
  else if (a >= 1e-5 && a < 1e9) body = a.toFixed(6)
  else { const [m, e] = a.toExponential(6).split('e'); body = `${m} * 10${sup(+e)}` }
  return v < 0 ? `(−${body})` : body
}

export class NewtonInterpolation extends Interpolation { // Newton divided difference
  solve() {
    const xs = this.rawXs, ys = this.rawYs, n = xs.length, xq = this.xq // ใช้ลำดับตามที่ผู้ใช้กรอก (x₀, x₁, …)
    const T = [ys.slice()]
    for (let k = 1; k < n; k++) { T[k] = []; for (let i = 0; i < n - k; i++) T[k][i] = (T[k - 1][i + 1] - T[k - 1][i]) / (xs[i + k] - xs[i]) }
    const coef = T.map(col => col[0])
    const f = x => { let s = 0, pr = 1; for (let k = 0; k < n; k++) { s += coef[k] * pr; pr *= x - xs[k] } return s }
    const rows = xs.map((x, i) => { const r = { i, x }; T.forEach((col, k) => (r[k ? `Δ${k}f` : 'f(x)'] = i < n - k ? col[i] : '')); return r })
    const result = this.done(f, rows, ['b₀…b' + (n - 1) + ' = ' + coef.map(v => +v.toFixed(6)).join(', '), `พหุนามดีกรี ${n - 1}`])
    // f(x) = b₀ + b₁(x−x₀) + b₂(x−x₀)(x−x₁) + …
    const terms = coef.slice(1).map((c, i) => `+(${coefStr(c)}${xs.slice(0, i + 1).map(xj => ` * (${num(xq)} − ${num(xj)})`).join('')})`)
    result.solution = { title: 'Solution', expr: { label: `f(${plain(xq)})`, body: plain(ys[0]) + terms.join(''), value: plain(result.value) } }
    return result
  }
}
export class LagrangeInterpolation extends Interpolation {
  solve() {
    const xs = this.rawXs, ys = this.rawYs, n = xs.length, xq = this.xq // ใช้ลำดับตามที่ผู้ใช้กรอก (x₀, x₁, …)
    const L = (i, x) => xs.reduce((p, xj, j) => (j === i ? p : p * (x - xj) / (xs[i] - xj)), 1)
    const f = x => ys.reduce((s, y, i) => s + y * L(i, x), 0)
    const basis = xs.map((x, i) => L(i, xq))
    const rows = xs.map((x, i) => ({ i, x, 'f(x)': ys[i], 'L_i(xq)': basis[i], 'f(x)·L_i': ys[i] * basis[i] }))

    const sub = k => String(k).replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[d])
    const six = v => { const s = Math.abs(v).toFixed(6); return v < 0 && +s !== 0 ? '−' + s : s }
    const product = (idx, term) => idx.map(term).join('')

    const result = this.done(f, rows, [`พหุนามดีกรี ${n - 1}`])
    result.solution = {
      title: 'Solution',
      // L_i = Π(x_j − x) / Π(x_j − x_i)  → แทนค่า → ค่าที่ได้
      basis: xs.map((x, i) => {
        const others = xs.map((_, j) => j).filter(j => j !== i)
        return {
          name: `L${sub(i)}`,
          symbolic: { num: product(others, j => `(x${sub(j)}−x)`), den: product(others, j => `(x${sub(j)}−x${sub(i)})`) },
          numeric: { num: product(others, j => `(${num(xs[j])}−${num(xq)})`), den: product(others, j => `(${num(xs[j])}−${num(x)})`) },
          value: six(basis[i])
        }
      }),
      // f(x) = ΣL_i f(x_i) แทนค่าแล้ว
      expr: { label: `f(${plain(xq)})`, body: basis.map((v, i) => `(${six(v)})(${num(ys[i])})`).join(' + '), value: plain(result.value) }
    }
    return result
  }
}
export class SplineInterpolation extends Interpolation {
  solve() {
    const s = new CubicSpline(this.xs, this.ys), xq = this.xq, j = s.index(xq), xj = this.xs[j]
    const result = this.done(x => s.eval(x), s.segments(), ['Natural cubic spline (S″ = 0 ที่ปลายทั้งสอง)'])
    // S_j(x) = a + b(x−x_j) + c(x−x_j)² + d(x−x_j)³  บนช่วงที่ x อยู่
    const dx = `(${num(xq)} − ${num(xj)})`
    result.solution = {
      title: 'Solution',
      interval: `ช่วงที่ ${j + 1}: x = ${plain(xj)} ถึง ${plain(this.xs[j + 1])}`,
      expr: { label: `f(${plain(xq)})`, body: `${plain(s.a[j])}+(${coefStr(s.b[j])} * ${dx})+(${coefStr(s.c[j])} * ${dx}²)+(${coefStr(s.d[j])} * ${dx}³)`, value: plain(result.value) }
    }
    return result
  }
}
