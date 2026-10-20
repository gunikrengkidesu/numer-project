/* ============ Linear algebra ============ */
export class LinearMethod {
  constructor(p) {
    this.A = p.A.trim().split(/\n+/).map(r => r.trim().split(/[\s,]+/).map(Number));
    this.b = p.b.trim().split(/[\s,]+/).map(Number);
    this.n = this.b.length; this.tol = +p.tol || 1e-6; this.max = +p.max || 100;
    this.x = p.x0.trim() ? p.x0.trim().split(/[\s,]+/).map(Number) : Array(this.n).fill(0);
    if (this.A.length !== this.n || this.A.some(r => r.length !== this.n) || [...this.A.flat(), ...this.b, ...this.x].some(isNaN) || this.x.length !== this.n)
      throw new Error("ขนาดเมทริกซ์/เวกเตอร์ไม่ตรงกัน หรือมีค่าที่ไม่ใช่ตัวเลข");
    this.rows = []; this.warn = "";
  }
  static fields = [["A", "เมทริกซ์ A (1 แถวต่อบรรทัด)", "4 1 1\n1 5 2\n1 2 6", "ta"], ["b", "เวกเตอร์ b", "6 8 9"], ["x0", "ค่าเริ่มต้น x₀ (เว้นว่าง = 0)", ""], ["tol", "Tolerance", "0.000001"], ["max", "Max iterations", "100"]];
  diagDominant() { return this.A.every((r, i) => Math.abs(r[i]) >= r.reduce((s, v, j) => j === i ? s : s + Math.abs(v), 0)); }
  norm(a, b) { return Math.max(...a.map((v, i) => Math.abs(v - b[i]))); }
  record(i, x, e) { const r = { i }; x.forEach((v, k) => r["x" + (k + 1)] = v); r["error"] = e; this.rows.push(r); }
  run() { throw new Error("abstract"); }
  solve() { this.run(); const last = this.rows[this.rows.length - 1]; return { kind: "linear", x: this.x, iters: this.rows.length, rows: this.rows, warn: this.warn, converged: last && last.error < this.tol }; }
}
export class Jacobi extends LinearMethod {
  run() {
    if (!this.diagDominant()) this.warn = "A ไม่ใช่ diagonally dominant — อาจไม่ลู่เข้า";
    let x = [...this.x];
    for (let k = 1; k <= this.max; k++) {
      const xn = x.map((_, i) => (this.b[i] - this.A[i].reduce((s, a, j) => j === i ? s : s + a * x[j], 0)) / this.A[i][i]);
      const e = this.norm(xn, x); this.record(k, xn, e); x = xn;
      if (e < this.tol || !x.every(isFinite)) break;
    }
    this.x = x;
  }
}
export class GaussSeidel extends LinearMethod {
  run() {
    if (!this.diagDominant()) this.warn = "A ไม่ใช่ diagonally dominant — อาจไม่ลู่เข้า";
    let x = [...this.x];
    for (let k = 1; k <= this.max; k++) {
      const old = [...x];
      for (let i = 0; i < this.n; i++) x[i] = (this.b[i] - this.A[i].reduce((s, a, j) => j === i ? s : s + a * x[j], 0)) / this.A[i][i];
      const e = this.norm(x, old); this.record(k, [...x], e);
      if (e < this.tol || !x.every(isFinite)) break;
    }
    this.x = x;
  }
}
export class ConjugateGradient extends LinearMethod {
  mv(v) { return this.A.map(r => r.reduce((s, a, j) => s + a * v[j], 0)); }
  dot(a, b) { return a.reduce((s, v, i) => s + v * b[i], 0); }
  run() {
    const sym = this.A.every((r, i) => r.every((v, j) => Math.abs(v - this.A[j][i]) < 1e-12));
    if (!sym) this.warn = "A ไม่สมมาตร — CG ต้องการ A แบบ symmetric positive definite";
    let x = [...this.x], Ax = this.mv(x), r = this.b.map((v, i) => v - Ax[i]), p = [...r], rs = this.dot(r, r);
    for (let k = 1; k <= this.max; k++) {
      const Ap = this.mv(p), alpha = rs / this.dot(p, Ap), xn = x.map((v, i) => v + alpha * p[i]);
      r = r.map((v, i) => v - alpha * Ap[i]);
      const rn = this.dot(r, r), e = Math.sqrt(rn);
      this.record(k, xn, e); x = xn;
      if (e < this.tol || !isFinite(e)) break;
      p = r.map((v, i) => v + (rn / rs) * p[i]); rs = rn;
    }
    this.x = x;
  }
}


/* ============ Direct methods (วิธีตรง) ============ */
const copy = M => M.map(r => [...r])
export class DirectMethod extends LinearMethod {
  static direct = true
  constructor(p) { super(p); this.steps = [] }
  log(title, M, note) { this.steps.push({ title, M: M ? copy(M) : null, note }) }
  check() { if (Math.abs(DirectMethod.det(this.A)) < 1e-12) throw new Error('det(A) = 0 — ระบบสมการไม่มีผลเฉลยเดียว') }
  static det(A) { // กำจัดแบบ pivot บางส่วน
    const M = copy(A), n = M.length; let d = 1
    for (let k = 0; k < n; k++) {
      let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i
      if (Math.abs(M[p][k]) < 1e-14) return 0
      if (p !== k) { [M[p], M[k]] = [M[k], M[p]]; d = -d }
      d *= M[k][k]
      for (let i = k + 1; i < n; i++) { const f = M[i][k] / M[k][k]; for (let j = k; j < n; j++) M[i][j] -= f * M[k][j] }
    }
    return d
  }
  forward(L, b) { const y = []; for (let i = 0; i < this.n; i++) { let s = b[i]; for (let j = 0; j < i; j++) s -= L[i][j] * y[j]; y[i] = s / L[i][i] } return y }
  backward(U, y) { const x = []; for (let i = this.n - 1; i >= 0; i--) { let s = y[i]; for (let j = i + 1; j < this.n; j++) s -= U[i][j] * x[j]; x[i] = s / U[i][i] } return x }
  jordan(M, label) { // Gauss-Jordan บน M (n × m)
    const n = this.n
    for (let k = 0; k < n; k++) {
      let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i
      if (p !== k) { [M[p], M[k]] = [M[k], M[p]]; this.log(`สลับแถว R${k + 1} ↔ R${p + 1}`, M) }
      const d = M[k][k]; M[k] = M[k].map(v => v / d)
      for (let i = 0; i < n; i++) if (i !== k) { const f = M[i][k]; M[i] = M[i].map((v, j) => v - f * M[k][j]) }
      this.log(`${label} คอลัมน์ ${k + 1}`, M)
    }
  }
  solve() { this.run(); return { kind: 'linear', direct: true, x: this.x, steps: this.steps, rows: [], iters: 0, warn: '', converged: true } }
}

export class Cramer extends DirectMethod {
  run() {
    this.check(); const D = DirectMethod.det(this.A)
    this.log('เมทริกซ์ A', this.A, `det(A) = ${+D.toFixed(8)}`)
    this.x = this.A.map((_, c) => {
      const Ai = this.A.map((r, i) => r.map((v, j) => (j === c ? this.b[i] : v)))
      const d = DirectMethod.det(Ai)
      this.log(`A${c + 1} (แทนคอลัมน์ ${c + 1} ด้วย b)`, Ai, `det(A${c + 1}) = ${+d.toFixed(8)} → x${c + 1} = ${+(d / D).toFixed(8)}`)
      return d / D
    })
  }
}
export class GaussElimination extends DirectMethod {
  run() {
    this.check(); const n = this.n, M = this.A.map((r, i) => [...r, this.b[i]])
    this.log('Augmented matrix [A | b]', M)
    for (let k = 0; k < n - 1; k++) {
      let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i
      if (p !== k) { [M[p], M[k]] = [M[k], M[p]]; this.log(`สลับแถว R${k + 1} ↔ R${p + 1}`, M) }
      for (let i = k + 1; i < n; i++) { const f = M[i][k] / M[k][k]; M[i] = M[i].map((v, j) => v - f * M[k][j]) }
      this.log(`Forward elimination คอลัมน์ ${k + 1}`, M)
    }
    this.x = this.backward(M.map(r => r.slice(0, n)), M.map(r => r[n]))
    this.log('Back substitution', null, 'x = [' + this.x.map(v => +v.toFixed(8)).join(', ') + ']')
  }
}
export class GaussJordan extends DirectMethod {
  run() {
    this.check(); const M = this.A.map((r, i) => [...r, this.b[i]])
    this.log('Augmented matrix [A | b]', M); this.jordan(M, 'Pivot/กำจัด')
    this.x = M.map(r => r[this.n])
  }
}
export class Inversion extends DirectMethod {
  run() {
    this.check(); const n = this.n, M = this.A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))])
    this.log('[A | I]', M); this.jordan(M, 'Gauss-Jordan')
    const inv = M.map(r => r.slice(n)); this.log('A⁻¹', inv)
    this.x = inv.map(r => r.reduce((s, v, j) => s + v * this.b[j], 0))
    this.log('x = A⁻¹ b', null, '[' + this.x.map(v => +v.toFixed(8)).join(', ') + ']')
  }
}
export class LUDecomposition extends DirectMethod {
  run() {
    this.check(); const n = this.n, U = copy(this.A), P = Array.from({ length: n }, (_, i) => i)
    const L = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))
    for (let k = 0; k < n; k++) {
      let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(U[i][k]) > Math.abs(U[p][k])) p = i
      if (p !== k) { [U[p], U[k]] = [U[k], U[p]];[P[p], P[k]] = [P[k], P[p]]; for (let j = 0; j < k; j++) [L[p][j], L[k][j]] = [L[k][j], L[p][j]] }
      for (let i = k + 1; i < n; i++) { L[i][k] = U[i][k] / U[k][k]; for (let j = k; j < n; j++) U[i][j] -= L[i][k] * U[k][j] }
    }
    if (P.some((v, i) => v !== i)) this.log('P (permutation: PA = LU)', P.map(r => Array.from({ length: n }, (_, j) => (j === r ? 1 : 0))))
    this.log('L', L); this.log('U', U)
    const y = this.forward(L, P.map(i => this.b[i])); this.log('Ly = Pb → y', y.map(v => [v]))
    this.x = this.backward(U, y); this.log('Ux = y → x', this.x.map(v => [v]))
  }
}
export class Cholesky extends DirectMethod {
  run() {
    const n = this.n
    if (!this.A.every((r, i) => r.every((v, j) => Math.abs(v - this.A[j][i]) < 1e-12))) throw new Error('A ต้องสมมาตร (symmetric) สำหรับ Cholesky')
    const L = Array.from({ length: n }, () => Array(n).fill(0))
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      let s = this.A[i][j]; for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k]
      if (i === j) { if (s <= 1e-12) throw new Error('A ไม่เป็น positive definite — ใช้ Cholesky ไม่ได้'); L[i][i] = Math.sqrt(s) } else L[i][j] = s / L[j][j]
    }
    const LT = L.map((_, i) => L.map(r => r[i])); this.log('L (A = L Lᵀ)', L); this.log('Lᵀ', LT)
    const y = this.forward(L, this.b); this.log('Ly = b → y', y.map(v => [v]))
    this.x = this.backward(LT, y); this.log('Lᵀx = y → x', this.x.map(v => [v]))
  }
}
