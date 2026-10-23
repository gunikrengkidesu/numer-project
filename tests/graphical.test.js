import { Graphical, Bisection } from '../src/core/rootMethods.js'
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m) }
// สแกนตามค่า i โดยตรง
const r = new Graphical({ fx: '43*x - 180', i: '0.1' }).solve()
ok(Math.abs(r.root - 4.1) < 1e-12, 'root ' + r.root)
ok(JSON.stringify(Object.keys(r.rows[0])) === '["iteration","x","f(x)"]', 'graphical table columns')
ok(r.rows[0].iteration === 1 && r.rows[0].x === 0 && r.rows[0]['f(x)'] === -180, 'first iteration')
ok(r.all.length === 1 && r.warn === '', 'result shape')
ok(new Graphical({ fx: 'x - 2', i: '0.1' }).solve().root === 2, 'root exactly on grid')
const none = new Graphical({ fx: 'x^2 + 1', i: '1' }).solve()
ok(none.all.length === 0 && none.warn.includes('ไม่พบ'), 'no root')
ok(Graphical.fields.every(f => f[0] !== 'tol') && Graphical.useTolerance === false, 'no tolerance')
let bad = false; try { new Graphical({ fx: 'x', i: '0' }) } catch { bad = true }
ok(bad, 'step must be > 0')
ok(JSON.stringify(Graphical.fields.map(f => f[0])) === '["i"]', 'graphical input keys')
ok(JSON.stringify(Graphical.fields.map(f => f[1])) === '["i (step)"]', 'graphical labels: i')
ok(JSON.stringify(Bisection.fields.map(f => f[1])) === '["xL","xR","error"]', 'bisection labels: xL, xR, error')
console.log('graphical passed')
