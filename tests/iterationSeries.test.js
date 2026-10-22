import { Bisection, Newton, Graphical } from '../src/core/rootMethods.js'
import { Jacobi, Cramer } from '../src/core/linearMethods.js'
import { buildChart } from '../src/core/iterationSeries.js'
const ok = (c, m) => { if (!c) throw new Error(m) }
const p = { fx: 'x^3 - x - 2', a: '1', b: '2', x0: '1.5', tol: '1e-8', max: '100' }
for (const K of [Bisection, Newton]) {
  const res = new K(p).solve(), c = buildChart(res), pts = c.series[0].points
  ok(pts.length <= 8 && pts.length >= 2, K.name + ' key points only')
  ok(res.rows.length > 8 ? pts.length < res.rows.length : true, 'reduced')
  ok(Math.abs(pts.at(-1).x - 1.52138) < 1e-4, K.name + ' last x')
  ok(pts[0].lines[0].startsWith('Iteration 1'), 'tooltip')
  ok(pts.at(-1).lines[0].includes('ผลลัพธ์'), 'last tagged')
  ok(Math.abs(c.curve.f(1.52138)) < 1e-3, 'curve is f(x)')
}
const g = buildChart(new Graphical({ fx: 'x^2-1', a: '-2', b: '2', step: '0.1' }).solve())
ok(g.series[0].points.length === 2 && g.xRange[0] === -2, 'graphical roots only')
const L = { A: '4 1 1\n1 5 2\n1 2 6', b: '6 8 9', x0: '', tol: '1e-6', max: '100' }
ok(buildChart(new Jacobi(L).solve()).series.length === 3, 'jacobi series')
ok(buildChart(new Cramer(L).solve()) === null, 'direct has no chart')
import { keyIndexes } from '../src/core/iterationSeries.js'
ok(keyIndexes(100).length <= 8 && keyIndexes(100).at(-1) === 99 && keyIndexes(100)[0] === 0, 'keyIndexes')
console.log('iteration series passed')
