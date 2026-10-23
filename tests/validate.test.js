import { matrixComplete, pointsComplete, isBlank, INCOMPLETE } from '../src/core/validate.js'
import { defaultMatrix } from '../src/core/matrix.js'
import { defaultPoints } from '../src/core/points.js'

const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m) }
const fill = (m, v = '1') => { m.A = m.A.map(r => r.map(() => v)); m.b = m.b.map(() => v); return m }
ok(isBlank('  ') && isBlank(undefined) && !isBlank('0'), 'isBlank')
ok(!matrixComplete(defaultMatrix()), 'blank matrix is incomplete')
const m = fill(defaultMatrix()); ok(matrixComplete(m), 'A,b filled, x0 blank is ok')
m.x0[0] = '1'; ok(!matrixComplete(m) && matrixComplete(m, false), 'partial x0 rejected only when x0 is used')
m.x0 = m.x0.map(() => '2'); ok(matrixComplete(m), 'x0 filled')
const m2 = fill(defaultMatrix()); m2.A[1][2] = ''; ok(!matrixComplete(m2), 'one blank cell')
ok(!pointsComplete(defaultPoints(false)), 'blank points')
const p = defaultPoints(false); p.rows[0] = ['0', '1']; ok(!pointsComplete(p), 'only one row')
p.rows[1] = ['1', '']; ok(!pointsComplete(p), 'partial row')
p.rows[1] = ['1', '3']; ok(pointsComplete(p), 'two complete rows, rest blank')
ok(INCOMPLETE === 'กรุณากรอกข้อมูลให้ครบถ้วน', 'message')
console.log('validate passed')
