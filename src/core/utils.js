/* ============ Utilities ============ */
export class ExprParser {
  static compile(src, v = "x") {
    const s = src.replace(/\^/g, "**").replace(/\blog\(/g, "log10(").replace(/\bln\(/g, "log(").replace(/\bpi\b/gi, "PI");
    if (/[^0-9a-zA-Z_+\-*/().,\s*]/.test(s)) throw new Error("นิพจน์มีอักขระที่ไม่รองรับ");
    const f = new Function(v, `with(Math){return (${s});}`);
    f(1);
    return f;
  }
}
export class Calculus {
  static d1(f, x, h = 1e-5) { return (f(x + h) - f(x - h)) / (2 * h); }
  static d2(f, x, h = 1e-4) { return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h); }
}
export const fmt = (n, d = 6) => (typeof n === "number" && isFinite(n)) ? (Math.abs(n) < 1e-4 && n !== 0 ? n.toExponential(3) : +n.toFixed(d)) : String(n);

