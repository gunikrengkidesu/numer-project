import { ExprParser } from './utils.js'

export class IntegralMethod {
  static input = 'fx'
  static fields = [['fx', 'f(x)', 'x^2 + 1'], ['a', 'a (ขอบล่าง)', '0'], ['b', 'b (ขอบบน)', '2']]
  constructor(p) {
    this.f = ExprParser.compile(p.fx); this.a = +p.a; this.b = +p.b; this.n = this.intervals(p)
    if (isNaN(this.a) || isNaN(this.b) || this.a === this.b) throw new Error('ขอบเขต a, b ไม่ถูกต้อง')
  }
  intervals(p) { return 1 }
  weights() { throw new Error('not implemented') } // น้ำหนักของแต่ละจุด และตัวคูณหน้าผลรวม
  solve() {
    const n = this.n, h = (this.b - this.a) / n, { w, k } = this.weights(n, h)
    const xs = Array.from({ length: n + 1 }, (_, i) => this.a + i * h), fs = xs.map(x => this.f(x))
    const value = k * fs.reduce((s, v, i) => s + w[i] * v, 0)
    if (!isFinite(value)) throw new Error('f(x) หาค่าไม่ได้ในช่วงนี้')
    return {
      kind: 'value', label: `I ≈ ∫[${this.a}, ${this.b}] f(x)dx`, value, warn: '', notes: [`h = ${+h.toFixed(8)} · n = ${n} ช่วง`],
      rows: xs.map((x, i) => ({ i, x, 'f(x)': fs[i], weight: w[i] })), plot: { f: this.f, a: this.a, b: this.b, points: xs.map((x, i) => [x, fs[i]]) }
    }
  }
}
class Composite extends IntegralMethod {
  static fields = [...IntegralMethod.fields, ['n', 'จำนวนช่วงย่อย n', '4']]
  intervals(p) { const n = parseInt(p.n); if (!(n >= 1)) throw new Error('n ต้องเป็นจำนวนเต็ม ≥ 1'); return n }
}
export class Trapezoidal extends IntegralMethod {
  weights(n, h) { return { w: [1, 1], k: h / 2 } }
}
export class CompositeTrapezoidal extends Composite {
  weights(n, h) { return { w: Array.from({ length: n + 1 }, (_, i) => (i === 0 || i === n ? 1 : 2)), k: h / 2 } }
}
export class Simpson extends IntegralMethod { // Simpson 1/3 (2 ช่วงย่อย)
  intervals() { return 2 }
  weights(n, h) { return { w: [1, 4, 1], k: h / 3 } }
}
export class CompositeSimpson extends Composite {
  intervals(p) { const n = super.intervals(p); if (n % 2) throw new Error('Composite Simpson ต้องใช้ n เป็นเลขคู่'); return n }
  weights(n, h) { return { w: Array.from({ length: n + 1 }, (_, i) => (i === 0 || i === n ? 1 : i % 2 ? 4 : 2)), k: h / 3 } }
}
