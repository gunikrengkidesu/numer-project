// ตัวช่วยอ่าน/เขียนข้อมูลจุด (x y ต่อบรรทัด)
export function parsePoints(s, cols) {
  const rows = String(s).trim().split(/\n+/).filter(r => r.trim()).map(r => r.trim().split(/[\s,]+/).map(Number))
  if (!rows.length || rows.some(r => r.some(isNaN) || r.length !== rows[0].length || (cols && r.length !== cols)))
    throw new Error('ข้อมูลจุดไม่ถูกต้อง: ต้องเป็นตัวเลข และมีจำนวนคอลัมน์เท่ากันทุกแถว')
  return rows
}
export const defaultPoints = multi => multi
  ? { k: 2, rows: [['1', '1', '6'], ['2', '1', '8'], ['1', '2', '9'], ['3', '2', '13'], ['2', '3', '14.5']] }
  : { k: 1, rows: [['0', '1'], ['1', '3'], ['2', '2'], ['3', '5']] }
export const serializePoints = m =>
  m.rows.filter(r => r.some(v => String(v).trim() !== '')).map(r => r.map(v => String(v).trim() || 'NaN').join(' ')).join('\n')
export function pointsFromString(s) {
  const rows = s.trim().split(/\n+/).map(r => r.trim().split(/[\s,]+/))
  return { k: rows[0].length - 1, rows }
}
