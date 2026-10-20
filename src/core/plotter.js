/* ============ UI ============ */
export class Plotter {
  static draw(cv, res) {
    const rows = res.rows, ctx = cv.getContext("2d"), W = cv.width = cv.clientWidth * 2, H = cv.height = cv.clientHeight * 2;
    const cs = getComputedStyle(document.documentElement), ac = cs.getPropertyValue("--ac"), mu = cs.getPropertyValue("--mu"), er = cs.getPropertyValue("--er");
    let a = +res.p.a, b = +res.p.b;
    if (res.p.a === undefined || res.kind !== "root") return;
    if (!isFinite(a) || !isFinite(b)) return;
    if (res.p.step === undefined) { const r = res.root, w = Math.max(Math.abs(b - a), 1); a = r - w; b = r + w; }
    const xs = [], N = 300; let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= N; i++) { const x = a + (b - a) * i / N, y = res.f(x); xs.push([x, y]); if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); } }
    lo = Math.min(lo, 0); hi = Math.max(hi, 0); const pad = (hi - lo) * .08 || 1; lo -= pad; hi += pad;
    const X = x => (x - a) / (b - a) * W, Y = y => H - (y - lo) / (hi - lo) * H;
    ctx.clearRect(0, 0, W, H); ctx.strokeStyle = mu; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); if (a < 0 && b > 0) { ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); } ctx.stroke();
    ctx.strokeStyle = ac; ctx.lineWidth = 3; ctx.beginPath(); xs.forEach(([x, y], i) => { if (!isFinite(y)) return; i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); }); ctx.stroke();
    ctx.fillStyle = er; (res.all || [res.root]).forEach(r => { if (isFinite(r)) { ctx.beginPath(); ctx.arc(X(r), Y(0), 7, 0, 7); ctx.fill(); } });
  }
}

// กราฟเส้นโค้ง + จุดข้อมูล + จุดคำตอบ (Interpolation / Integration / Differentiation)
export class CurvePlotter {
  static draw(cv, { f, a, b, points = [], mark = null }) {
    const W = (cv.width = cv.clientWidth * 2), H = (cv.height = cv.clientHeight * 2), ctx = cv.getContext('2d')
    const cs = getComputedStyle(document.documentElement), ac = cs.getPropertyValue('--ac'), mu = cs.getPropertyValue('--mu'), er = cs.getPropertyValue('--er')
    const N = 300, xs = Array.from({ length: N + 1 }, (_, i) => a + (b - a) * i / N), ys = xs.map(f)
    let lo = Infinity, hi = -Infinity
    ;[...ys, ...points.map(p => p[1]), ...(mark ? [mark[1]] : [])].forEach(y => { if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y) } })
    if (!isFinite(lo)) return
    lo = Math.min(lo, 0); hi = Math.max(hi, 0); const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad
    const X = x => (x - a) / (b - a) * W, Y = y => H - (y - lo) / (hi - lo) * H
    ctx.clearRect(0, 0, W, H); ctx.strokeStyle = mu; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0))
    if (a < 0 && b > 0) { ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H) } ctx.stroke()
    ctx.strokeStyle = ac; ctx.lineWidth = 3; ctx.beginPath()
    xs.forEach((x, i) => { if (!isFinite(ys[i])) return; i ? ctx.lineTo(X(x), Y(ys[i])) : ctx.moveTo(X(x), Y(ys[i])) }); ctx.stroke()
    ctx.fillStyle = mu; points.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(X(x), Y(y), 6, 0, 7); ctx.fill() })
    if (mark) { ctx.fillStyle = er; ctx.beginPath(); ctx.arc(X(mark[0]), Y(mark[1]), 9, 0, 7); ctx.fill() }
  }
}
