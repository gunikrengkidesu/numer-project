import { NewtonInterpolation, LagrangeInterpolation, SplineInterpolation } from '../src/core/interpolation.js'
import { SplineExtrapolation, MultipleRegression } from '../src/core/extrapolation.js'
import { Trapezoidal, CompositeTrapezoidal, Simpson, CompositeSimpson } from '../src/core/integration.js'
import { ForwardDifference, BackwardDifference, CentralDifference } from '../src/core/differentiation.js'
const near = (a, b, t = 1e-4) => { if (Math.abs(a - b) > t) throw new Error(`${a} != ${b}`) }
const sq = '0 0\n1 1\n2 4\n3 9'
near(new NewtonInterpolation({ pts: sq, xq: '1.5' }).solve().value, 2.25)
near(new LagrangeInterpolation({ pts: sq, xq: '1.5' }).solve().value, 2.25)
near(new SplineInterpolation({ pts: sq, xq: '2' }).solve().value, 4)
near(new SplineExtrapolation({ pts: '0 1\n1 3\n2 5\n3 7', xq: '4' }).solve().value, 9)
const mr = new MultipleRegression({ pts: '1 1 6\n2 1 8\n1 2 9\n3 2 13\n2 3 14', xq: '4 5' }).solve()
near(mr.value, 24)
const fx = { fx: 'x^2', a: '0', b: '2', n: '1000' }
near(new CompositeTrapezoidal(fx).solve().value, 8 / 3, 1e-5)
near(new Simpson(fx).solve().value, 8 / 3)
near(new CompositeSimpson({ ...fx, n: '4' }).solve().value, 8 / 3)
near(new Trapezoidal({ ...fx }).solve().value, 4)
let bad = false; try { new CompositeSimpson({ ...fx, n: '3' }) } catch { bad = true }
if (!bad) throw new Error('odd n should fail')
const d = { fx: 'x^3', x: '2', h: '0.001' }
near(new CentralDifference({ ...d, order: '1' }).solve().value, 12, 1e-4)
near(new CentralDifference({ ...d, order: '2' }).solve().value, 12, 1e-4)
near(new ForwardDifference({ ...d, order: '1' }).solve().value, 12, 0.05)
near(new BackwardDifference({ ...d, order: '2' }).solve().value, 12, 0.05)
console.log('new methods passed')
