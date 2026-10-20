import { common, Graphical, Bisection, FalsePosition, Newton, OnePoint, Secant, Taylor } from './rootMethods.js'
import { Cramer, GaussElimination, GaussJordan, Inversion, LUDecomposition, Cholesky, Jacobi, GaussSeidel, ConjugateGradient } from './linearMethods.js'
import { NewtonInterpolation, LagrangeInterpolation, SplineInterpolation } from './interpolation.js'
import { SplineExtrapolation, MultipleRegression } from './extrapolation.js'
import { Trapezoidal, CompositeTrapezoidal, Simpson, CompositeSimpson } from './integration.js'
import { ForwardDifference, BackwardDifference, CentralDifference } from './differentiation.js'

// mode = รูปแบบ input ของหมวด (root | matrix | points | fx) — คลาสกำหนด static input เองได้
// เพิ่มวิธีใหม่: เขียนคลาสแล้วเติมที่นี่ที่เดียว
export const REGISTRY = {
  'Root of Equation': { mode: 'root', common, items: { Graphical, Bisection, 'False Position': FalsePosition, Newton, 'One-Point': OnePoint, Secant, Taylor } },
  'Linear Algebra': { mode: 'matrix', common: [], items: { "Cramer's Rule": Cramer, 'Gauss Elimination': GaussElimination, 'Gauss-Jordan': GaussJordan, Inversion, 'LU Decomposition': LUDecomposition, Cholesky, Jacobi, 'Gauss-Seidel': GaussSeidel, 'Conjugate Gradient': ConjugateGradient } },
  Interpolation: { mode: 'points', items: { Newton: NewtonInterpolation, Lagrange: LagrangeInterpolation, Spline: SplineInterpolation } },
  Extrapolation: { mode: 'points', items: { Spline: SplineExtrapolation, Multiple: MultipleRegression } },
  Integration: { mode: 'fx', items: { Trapezoidal, 'Composite Trapezoidal': CompositeTrapezoidal, Simpson, 'Composite Simpson': CompositeSimpson } },
  Differentiation: { mode: 'fx', items: { Forward: ForwardDifference, Backward: BackwardDifference, Central: CentralDifference } }
}
