import { Bisection, Newton, Taylor, Secant, FalsePosition, OnePoint } from '../src/core/rootMethods.js'
import { Jacobi, GaussSeidel, ConjugateGradient } from '../src/core/linearMethods.js'
const near = (a, b, t = 1e-4) => { if (Math.abs(a - b) > t) throw new Error(`${a} != ${b}`) }
const p = { fx: 'x^3 - x - 2', a: '1', b: '2', x0: '1', x1: '2', gx: 'cbrt(x + 2)', tol: '1e-8', max: '100' }
for (const K of [Bisection, FalsePosition, Newton, Taylor, Secant, OnePoint]) near(new K(p).solve().root, 1.52138)
const L = { A: '4 1 1\n1 5 2\n1 2 6', b: '6 8 9', x0: '', tol: '1e-9', max: '200' }
for (const K of [Jacobi, GaussSeidel, ConjugateGradient]) new K(L).solve().x.forEach(v => near(v, 1))
console.log('all tests passed')
