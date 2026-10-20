import { ExprParser, Calculus } from './utils.js'
/* ============ Root of equation ============ */
export class RootMethod {
  static fields = [];
  constructor(p) { this.p = p; this.f = ExprParser.compile(p.fx); this.tol = +p.tol || 1e-6; this.max = +p.max || 50; this.rows = []; this.root = null; }
  err(n, o) { return n === 0 ? Math.abs(n - o) : Math.abs((n - o) / n) * 100; }
  solve() { throw new Error("not implemented"); }
  result() { return { kind: "root", root: this.root, fx: this.f(this.root), iters: this.rows.length, rows: this.rows, f: this.f, p: this.p }; }
}
export const common = [["fx", "f(x)", "x^3 - x - 2"], ["tol", "Tolerance (%)", "0.000001"], ["max", "Max iterations", "50"]];
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
export class Bisection extends Bracket { point(a, b) { return (a + b) / 2; } }
export class FalsePosition extends Bracket { point(a, b) { const fa = this.f(a), fb = this.f(b); return (a * fb - b * fa) / (fb - fa); } }
export class Newton extends RootMethod {
  static fields = [["x0", "x₀", "1.5"]];
  step(x) { return x - this.f(x) / Calculus.d1(this.f, x); }
  solve() {
    let x = +this.p.x0;
    for (let i = 1; i <= this.max; i++) {
      const xn = this.step(x), e = this.err(xn, x);
      this.rows.push({ i, x, "f(x)": this.f(x), "x new": xn, "error %": e });
      x = xn; this.root = xn;
      if (e < this.tol || !isFinite(xn)) break;
    }
    return this.result();
  }
}
export class Taylor extends Newton { // Taylor อันดับ 2: f + f'h + f''h²/2 = 0
  step(x) {
    const f0 = this.f(x), f1 = Calculus.d1(this.f, x), f2 = Calculus.d2(this.f, x);
    const D = f1 * f1 - 2 * f0 * f2;
    if (D < 0 || Math.abs(f2) < 1e-12) return x - f0 / f1;
    const h1 = (-f1 + Math.sqrt(D)) / f2, h2 = (-f1 - Math.sqrt(D)) / f2;
    return x + (Math.abs(h1) < Math.abs(h2) ? h1 : h2);
  }
}
export class OnePoint extends RootMethod {
  static fields = [["gx", "g(x) (จัด x = g(x))", "cbrt(x + 2)"], ["x0", "x₀", "1"]];
  constructor(p) { super(p); this.g = ExprParser.compile(p.gx.replace(/cbrt/g, "Math.cbrt")); }
  solve() {
    let x = +this.p.x0;
    for (let i = 1; i <= this.max; i++) {
      const xn = this.g(x), e = this.err(xn, x);
      this.rows.push({ i, x, "g(x)": xn, "error %": e });
      x = xn; this.root = xn;
      if (e < this.tol || !isFinite(xn)) break;
    }
    return this.result();
  }
}
export class Secant extends RootMethod {
  static fields = [["x0", "x₀", "1"], ["x1", "x₁", "2"]];
  solve() {
    let x0 = +this.p.x0, x1 = +this.p.x1;
    for (let i = 1; i <= this.max; i++) {
      const f0 = this.f(x0), f1 = this.f(x1), xn = x1 - f1 * (x1 - x0) / (f1 - f0), e = this.err(xn, x1);
      this.rows.push({ i, "x(i-1)": x0, "x(i)": x1, "x(i+1)": xn, "error %": e });
      x0 = x1; x1 = xn; this.root = xn;
      if (e < this.tol || !isFinite(xn)) break;
    }
    return this.result();
  }
}
export class Graphical extends RootMethod {
  static fields = [["a", "x เริ่มต้น", "-3"], ["b", "x สิ้นสุด", "3"], ["step", "Step", "0.1"]];
  solve() {
    const a = +this.p.a, b = +this.p.b, h = +this.p.step || 0.1, roots = [];
    let i = 0;
    for (let x = a; x < b; x += h, i++) {
      const y0 = this.f(x), y1 = this.f(x + h);
      this.rows.push({ i, x, "f(x)": y0 });
      if (y0 === 0) roots.push(x);
      else if (y0 * y1 < 0) { // refine ด้วย bisection
        let lo = x, hi = x + h;
        for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (this.f(lo) * this.f(m) <= 0) hi = m; else lo = m; }
        roots.push((lo + hi) / 2);
      }
    }
    this.root = roots[0] ?? NaN;
    const r = this.result(); r.all = roots; return r;
  }
}

