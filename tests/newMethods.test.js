import { NewtonInterpolation, LagrangeInterpolation, SplineInterpolation } from '../src/core/interpolation.js'
import { SplineExtrapolation, MultipleRegression } from '../src/core/extrapolation.js'
import { Trapezoidal, CompositeTrapezoidal, Simpson, CompositeSimpson } from '../src/core/integration.js'
import { ForwardDifference, BackwardDifference, CentralDifference } from '../src/core/differentiation.js'
const near = (a, b, t = 1e-4) => { if (Math.abs(a - b) > t) throw new Error(`${a} != ${b}`) }
const sq = '0 0\n1 1\n2 4\n3 9'
const newton = new NewtonInterpolation({ pts: sq, xq: '1.5' }).solve()
const lagrange = new LagrangeInterpolation({ pts: sq, xq: '1.5' }).solve()
const spline = new SplineInterpolation({ pts: sq, xq: '2' }).solve()
near(newton.value, 2.25)
near(lagrange.value, 2.25)
near(spline.value, 4)
if (newton.plot || lagrange.plot || spline.plot || !newton.hideTable || !lagrange.hideTable || !spline.hideTable) throw new Error('Interpolation output display flags are incorrect')
if (lagrange.rows[0]['f(x)'] === undefined || lagrange.rows[0]['L_i(xq)'] === undefined || lagrange.rows[0]['f(x)·L_i'] === undefined || !lagrange.solution) throw new Error('Lagrange details are missing')
const extrapolation = new SplineExtrapolation({ pts: '0 1\n1 3\n2 5\n3 7', xq: '4' }).solve()
near(extrapolation.value, 9)
if (!extrapolation.hideTable) throw new Error('Extrapolation table should be hidden')
const mr = new MultipleRegression({ pts: '1 1 6\n2 1 8\n1 2 9\n3 2 13\n2 3 14', xq: '4 5' }).solve()
near(mr.value, 24)
const fx = { fx: 'x^2', a: '0', b: '2', n: '1000' }
near(new CompositeTrapezoidal(fx).solve().value, 8 / 3, 1e-5)
near(new Simpson(fx).solve().value, 8 / 3)
near(new CompositeSimpson({ ...fx, n: '4' }).solve().value, 8 / 3)
near(new Trapezoidal({ ...fx }).solve().value, 4)
if (!new Trapezoidal({ ...fx }).solve().answerOnly) throw new Error('Integration should show answer only')
let bad = false; try { new CompositeSimpson({ ...fx, n: '3' }) } catch { bad = true }
if (!bad) throw new Error('odd n should fail')
const d = { fx: 'x^3', x: '2', h: '0.001' }
near(new CentralDifference({ ...d, order: '1' }).solve().value, 12, 1e-4)
near(new CentralDifference({ ...d, order: '2' }).solve().value, 12, 1e-4)
near(new ForwardDifference({ ...d, order: '1' }).solve().value, 12, 0.05)
near(new BackwardDifference({ ...d, order: '2' }).solve().value, 12, 0.05)
if (!new CentralDifference({ ...d, order: '1' }).solve().answerOnly) throw new Error('Differentiation should show answer only')
console.log('new methods passed')
