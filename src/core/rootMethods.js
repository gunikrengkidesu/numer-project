import { ExprParser, Calculus } from './utils.js'
/* ============ Root of equation ============ */
export class RootMethod {
  static fields = [];
  static HARD_LIMIT = 10000 // ไม่มีช่อง Max iterations: วนจนลู่เข้า (กันวนไม่รู้จบที่ 10,000 รอบ)
  constructor(p) { this.p = p; this.f = ExprParser.compile(p.fx); this.tol = +p.tol || 1e-6; this.max = RootMethod.HARD_LIMIT; this.rows = []; this.root = null; }
  err(n, o) { return n === 0 ? Math.abs(n - o) : Math.abs((n - o) / n) * 100; }
  solve() { throw new Error("not implemented"); }
  result() {
    const last = this.rows[this.rows.length - 1], stuck = this.rows.length >= this.max && !(last?.["error %"] < this.tol)
    return { kind: "root", root: this.root, fx: this.f(this.root), iters: this.rows.length, rows: this.rows, f: this.f, p: this.p,
      warn: stuck ? `ยังไม่ลู่เข้าหลังครบ ${this.max.toLocaleString()} iterations — ลองเปลี่ยนค่าเริ่มต้นหรือวิธีอื่น` : "" };
  }
}
export const common = [["fx", "f(x)", "43*x-180"], ["tol", "Tolerance (%)", "0.00001"]];
export class Bracket extends RootMethod {
  static fields = [["a", "a (ซ้าย)", "1"], ["b", "b (ขวา)", "2"]];
  point(a, b) { throw new Error("abstract"); }
  solve() {
    let a = +this.p.a, b = +this.p.b, old = 0;
    if (this.f(a) * this.f(b) > 0) throw new Error("f(a) และ f(b) ต้องมีเครื่องหมายต่างกัน");
    for (let i = 1; i <= this.max; i++) {
      const c = this.point(a, b), fc = this.f(c), e = i === 1 ? NaN : this.err(c, old);
      this.rows.push({ i, a, b, c, "f(c)": fc, "error %": e });
      if (this.f(a) * fc < 0) b = c; else a = c;
      if (fc === 0 || e < this.tol) { this.root = c; break; }
      old = c; this.root = c;
    }
    return this.result();
  }
}
export class Bisection extends RootMethod {
  static useTolerance = false
  static fields = [["xL", "xL", "0"], ["xR", "xR", "10"], ["error", "error", "0.000001"]]
  constructor(p) {
    super({ ...p, tol: p.error ?? p.tol })
    this.xL = +(p.xL ?? p.a); this.xR = +(p.xR ?? p.b); this.tol = +(p.error ?? p.tol)
    if (![this.xL, this.xR, this.tol].every(isFinite) || this.xL >= this.xR) throw new Error("ช่วง xL–xR ไม่ถูกต้อง (ต้อง xL < xR)")
    if (this.tol <= 0) throw new Error("error ต้องมากกว่า 0")
    this.p = { ...this.p, xL: this.xL, xR: this.xR, error: this.tol, a: this.xL, b: this.xR, tol: this.tol }
  }
  solve() {
    let xL = this.xL, xR = this.xR, fL = this.f(xL), fR = this.f(xR)
    if (fL * fR > 0) throw new Error("f(xL) และ f(xR) ต้องมีเครื่องหมายต่างกัน")
    if (fL === 0) return this.resultFor(xL, false)
    if (fR === 0) return this.resultFor(xR, false)

    let xm = (xL + xR) / 2, fm = this.f(xm)
    if (fm === 0) return this.resultFor(xm, false)
    if (fm * fR > 0) { xR = xm; fR = fm } else { xL = xm; fL = fm }

    for (let i = 1; i <= this.max; i++) {
      const xNew = (xL + xR) / 2, fNew = this.f(xNew)
      const e = xNew === 0 ? Math.abs(xNew - xm) : Math.abs((xNew - xm) / xNew)
      const row = { iteration: i, xL, xR, "f(xL)": fL, "f(xR)": fR, error: e }
      Object.defineProperties(row, { i: { value: i }, c: { value: xNew }, "error %": { value: e } })
      this.rows.push(row)
      this.root = xNew
      if (fNew === 0 || e <= this.tol || !isFinite(xNew)) return this.resultFor(xNew, false)
      if (fNew * fR > 0) { xR = xNew; fR = fNew } else { xL = xNew; fL = fNew }
      xm = xNew
    }
    return this.resultFor(this.root, true)
  }
  resultFor(root, stuck) {
    return { kind: "root", root, fx: this.f(root), iters: this.rows.length, rows: this.rows, f: this.f, p: this.p,
      warn: stuck ? `ยังไม่ลู่เข้าหลังครบ ${this.max.toLocaleString()} iterations — ลองเพิ่มค่า error` : "" }
  }
}
export class FalsePosition extends RootMethod {
  static useTolerance = false
  static fields = [["xL", "xL", "0"], ["xR", "xR", "10"], ["error", "error", "0.000001"]]
  constructor(p) {
    super({ ...p, tol: p.error ?? p.tol })
    this.xL = +(p.xL ?? p.a); this.xR = +(p.xR ?? p.b); this.tol = +(p.error ?? p.tol)
    if (![this.xL, this.xR, this.tol].every(isFinite) || this.xL >= this.xR) throw new Error("ช่วง xL–xR ไม่ถูกต้อง (ต้อง xL < xR)")
    if (this.tol <= 0) throw new Error("error ต้องมากกว่า 0")
    this.p = { ...this.p, xL: this.xL, xR: this.xR, error: this.tol, a: this.xL, b: this.xR, tol: this.tol }
  }
  solve() {
    let xL = this.xL, xR = this.xR, fL = this.f(xL), fR = this.f(xR)
    if (fL * fR > 0) throw new Error("f(xL) และ f(xR) ต้องมีเครื่องหมายต่างกัน")
    if (fL === 0) return this.resultFor(xL, false)
    if (fR === 0) return this.resultFor(xR, false)

    let xOld = this.point(xL, xR, fL, fR), fOld = this.f(xOld)
    if (fOld * fR < 0) { xL = xOld; fL = fOld } else { xR = xOld; fR = fOld }

    for (let i = 1; i <= this.max; i++) {
      const xNew = this.point(xL, xR, fL, fR), fNew = this.f(xNew)
      const e = xNew === 0 ? Math.abs(xNew - xOld) : Math.abs((xNew - xOld) / xNew)
      const row = { iteration: i, xL, xR, "f(xL)": fL, "f(xR)": fR, error: e }
      Object.defineProperties(row, { i: { value: i }, c: { value: xNew }, "error %": { value: e } })
      this.rows.push(row)
      this.root = xNew
      if (fNew === 0 || e <= this.tol || !isFinite(xNew)) return this.resultFor(xNew, false)
      if (fNew * fR < 0) { xL = xNew; fL = fNew } else { xR = xNew; fR = fNew }
      xOld = xNew
    }
    return this.resultFor(this.root, true)
  }
  point(xL, xR, fL, fR) { return (xL * fR - xR * fL) / (fR - fL) }
  resultFor(root, stuck) {
    return { kind: "root", root, fx: this.f(root), iters: this.rows.length, rows: this.rows, f: this.f, p: this.p,
      warn: stuck ? `ยังไม่ลู่เข้าหลังครบ ${this.max.toLocaleString()} iterations — ลองเพิ่มค่า error` : "" }
  }
}
export class Newton extends RootMethod {
  static useTolerance = false
  static fields = [["x", "x", "2"]];
  constructor(p) {
    super(p)
    this.x = +(p.x ?? p.x0)
    if (!isFinite(this.x)) throw new Error("ค่า x ไม่ถูกต้อง")
    this.p = { ...this.p, x: this.x }
  }
  solve() {
    let x = this.x
    for (let i = 1; i <= this.max; i++) {
      const fx = this.f(x), derivative = Calculus.d1(this.f, x)
      if (derivative === 0) throw new Error(`อนุพันธ์ของ f(x) เป็นศูนย์ที่ x = ${x}`)
      const xNew = x - fx / derivative, fNew = this.f(xNew)
      const e = xNew === 0 ? Math.abs(xNew - x) : Math.abs((xNew - x) / xNew)
      const row = { iteration: i, x, xNew, "f(x)": fx, "f(xNew)": fNew, error: e }
      Object.defineProperties(row, { i: { value: i }, "error %": { value: e } })
      this.rows.push(row)
      x = xNew; this.root = xNew
      if (e <= this.tol || !isFinite(xNew)) break
    }
    return this.result();
  }
}
export class OnePoint extends RootMethod {
  static input = "onepoint"
  static useTolerance = false
  static fields = [["gx", "g(x)", "x^4-13"], ["x", "x", "0"], ["error", "error", "0.000001"]];
  constructor(p) {
    super({ ...p, fx: p.fx ?? p.gx, tol: p.error ?? p.tol })
    this.x = +(p.x ?? p.x0); this.tol = +(p.error ?? p.tol)
    if (![this.x, this.tol].every(isFinite)) throw new Error("ค่า x และ error ไม่ถูกต้อง")
    if (this.tol <= 0) throw new Error("error ต้องมากกว่า 0")
    this.g = ExprParser.compile(p.gx.replace(/cbrt/g, "Math.cbrt"));
    this.p = { ...this.p, x: this.x, error: this.tol, x0: this.x, tol: this.tol }
  }
  solve() {
    let x = this.x;
    for (let i = 1; i <= this.max; i++) {
      const gx = this.g(x), e = gx === 0 ? Math.abs(gx - x) : Math.abs((gx - x) / gx);
      const row = { iteration: i, x, "g(x)": gx, error: e }
      Object.defineProperties(row, { i: { value: i }, "error %": { value: e } })
      this.rows.push(row);
      const converged = e <= this.tol;
      x = gx; this.root = gx;
      if (converged || !isFinite(gx)) break;
      if (!isFinite(gx)) throw new Error(`g(x) หาค่าไม่ได้ที่ x = ${x} (เช่นหารด้วยศูนย์) — เลือกค่า x เริ่มต้นอื่น`);
    }
    return this.result();
  }
}
export class Secant extends RootMethod {
  static useTolerance = false
  static fields = [["xOld", "xOld", "2"], ["x", "x", "1"]];
  constructor(p) {
    super(p)
    this.xOld = +(p.xOld ?? p.x0); this.x = +(p.x ?? p.x1)
    if (![this.xOld, this.x].every(isFinite)) throw new Error("ค่า xOld และ x ไม่ถูกต้อง")
    this.p = { ...this.p, xOld: this.xOld, x: this.x }
  }
  solve() {
    let xOld = this.xOld, x = this.x
    for (let i = 1; i <= this.max; i++) {
      const fOld = this.f(xOld), fx = this.f(x), denominator = fOld - fx
      if (denominator === 0) throw new Error("f(xOld) และ f(x) ต้องไม่เท่ากัน")
      const xNew = x - (fx * (x - xOld)) / (fx - fOld)
      const fNew = this.f(xNew), e = xNew === 0 ? Math.abs(xNew - xOld) : Math.abs((xNew - xOld) / xNew)
      const row = { xOld, x, xNew, "f(xOld)": fOld, "f(x)": fx, "f(xNew)": fNew, error: e }
      Object.defineProperties(row, { i: { value: i }, "error %": { value: e } })
      this.rows.push(row)
      xOld = x; x = xNew; this.root = xNew
      if (e <= this.tol || !isFinite(xNew)) break;
    }
    return this.result();
  }
}
// Graphical method: สแกนช่วง [0, 10] ตามค่า i โดยตรง (ไม่มี tolerance)
export class Graphical extends RootMethod {
  static useTolerance = false
  static MAX_STEPS = 3000000 // กัน step ละเอียดเกินไปจนค้าง
  static fields = [["i", "i (step)", "0.000001"]]; // f(x), i — ไม่มี tolerance
  constructor(p) {
    super(p);
    this.a = 0; this.b = 10; this.step = +p.i; this.count = 0;
    if (!isFinite(this.step)) throw new Error("i (step) ไม่ถูกต้อง");
    if (this.step <= 0) throw new Error("i (step) ต้องมากกว่า 0");
    this.p = { ...p, a: this.a, b: this.b, i: this.step, step: this.step };
  }
  record(x, fx) { this.rows.push({ iteration: ++this.count, x, "f(x)": fx }); }
  count_(len, step) {
    const n = Math.ceil(len / step - 1e-9);
    if (n > Graphical.MAX_STEPS) throw new Error(`Step เล็กเกินไป (เกิน ${Graphical.MAX_STEPS.toLocaleString()} รอบ)`);
    return n;
  }
  scan() {
    const n = this.count_(this.b - this.a, this.step);
    for (let k = 0; k < n; k++) {
      const x = this.a + k * this.step, next = Math.min(x + this.step, this.b), f1 = this.f(x), f2 = this.f(next);
      this.record(x, f1);
      if (Math.abs(f1) < 1e-12) return x;
      if (Math.abs(f2) < 1e-12) return next;
      if (f1 * f2 < 0) return x;
    }
    return null;
  }
  solve() {
    const root = this.scan();
    const found = root !== null && isFinite(root);
    return {
      kind: "root", root: found ? root : NaN, fx: found ? this.f(root) : NaN, iters: this.rows.length, rows: this.rows, f: this.f, p: this.p,
      all: found ? [root] : [], warn: found ? "" : `ไม่พบรากในช่วง [${this.a}, ${this.b}] ด้วย i = ${this.step} — ลองขยายช่วงหรือลดค่า i`
    };
  }
}
