import { ExprParser, Calculus } from './utils.js'

// อนุพันธ์เชิงตัวเลข: f⁽ᵏ⁾(x) ≈ (1/hᵏ) Σ coef·f(x + offset·h)
export class DiffMethod {
  static input = 'fx'
  static fields = [['fx', 'f(x)', 'x^3'], ['x', 'x', '2'], ['h', 'h (step)', '0.01'], ['order', 'อนุพันธ์อันดับ (1 หรือ 2)', '1']]
  static stencils = { 1: [], 2: [] }
  constructor(p) {
    this.f = ExprParser.compile(p.fx); this.x = +p.x; this.h = +p.h; this.order = +p.order
    if (isNaN(this.x) || !this.h) throw new Error('x หรือ h ไม่ถูกต้อง')
    if (![1, 2].includes(this.order)) throw new Error('อันดับต้องเป็น 1 หรือ 2')
  }
  solve() {
    const pts = this.constructor.stencils[this.order], { f, x, h, order } = this
    const rows = pts.map(([o, c]) => ({ offset: o, x_i: x + o * h, 'f(x_i)': f(x + o * h), coef: c }))
    const value = rows.reduce((s, r) => s + r.coef * r['f(x_i)'], 0) / h ** order
    const ref = order === 1 ? Calculus.d1(f, x) : Calculus.d2(f, x)
    const r = Math.max(1, 5 * Math.abs(h))
    return {
      kind: 'value', label: `f${order === 1 ? '′' : '″'}(${x})`, value, rows, warn: '', answerOnly: true,
      notes: [`ค่าอ้างอิง (central, h เล็กมาก) ≈ ${+ref.toPrecision(8)} · คลาดเคลื่อน ≈ ${Math.abs(value - ref).toExponential(2)}`],
      plot: { f, a: x - r, b: x + r, points: rows.map(q => [q.x_i, q['f(x_i)']]), mark: [x, f(x)] }
    }
  }
}
export class ForwardDifference extends DiffMethod {
  static stencils = { 1: [[0, -1], [1, 1]], 2: [[0, 1], [1, -2], [2, 1]] }
}
export class BackwardDifference extends DiffMethod {
  static stencils = { 1: [[-1, -1], [0, 1]], 2: [[-2, 1], [-1, -2], [0, 1]] }
}
export class CentralDifference extends DiffMethod {
  static stencils = { 1: [[-1, -0.5], [1, 0.5]], 2: [[-1, 1], [0, -2], [1, 1]] }
}
