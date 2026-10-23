import { Bisection, Newton, Secant, FalsePosition, OnePoint } from '../src/core/rootMethods.js'
import { Jacobi, GaussSeidel, ConjugateGradient } from '../src/core/linearMethods.js'
const near = (a, b, t = 1e-4) => { if (Math.abs(a - b) > t) throw new Error(`${a} != ${b}`) }
const p = { fx: 'x^3 - x - 2', a: '1', b: '2', x0: '1', x1: '2', gx: 'cbrt(x + 2)', tol: '1e-8', max: '100' }
for (const K of [Bisection, FalsePosition, Newton, Secant, OnePoint]) near(new K(p).solve().root, 1.52138)
const newton = new Newton({ fx: 'x^2 - 7', x: '2' }).solve()
if (JSON.stringify(Object.keys(newton.rows[0])) !== '["iteration","x","xNew","f(x)","f(xNew)","error"]') throw new Error('Newton table columns are incorrect')
const secant = new Secant({ fx: 'x^3 - x - 2', xOld: '2', x: '1' }).solve()
if (JSON.stringify(Object.keys(secant.rows[0])) !== '["xOld","x","xNew","f(xOld)","f(x)","f(xNew)","error"]') throw new Error('Secant table columns are incorrect')
const L = { A: '4 1 1\n1 5 2\n1 2 6', b: '6 8 9', x0: '', tol: '1e-9', max: '200' }
for (const K of [Jacobi, GaussSeidel, ConjugateGradient]) new K(L).solve().x.forEach(v => near(v, 1))
console.log('all tests passed')
