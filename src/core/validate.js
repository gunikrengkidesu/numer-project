export const INCOMPLETE = 'กรุณากรอกข้อมูลให้ครบถ้วน'
export const isBlank = v => String(v ?? '').trim() === ''

// เมทริกซ์: A และ b ต้องครบทุกช่อง · x₀ เว้นว่างทั้งหมดได้ แต่ถ้ากรอกต้องครบ
export const matrixComplete = (m, needX0 = true) =>
  m.A.every(r => r.every(v => !isBlank(v))) && m.b.every(v => !isBlank(v)) &&
  (!needX0 || m.x0.every(isBlank) || m.x0.every(v => !isBlank(v)))

// ตารางจุด: แถวที่เริ่มกรอกต้องครบทุกคอลัมน์ และต้องมีอย่างน้อย 2 แถว
export const pointsComplete = m => {
  const started = m.rows.filter(r => r.some(v => !isBlank(v)))
  return started.length >= 2 && started.every(r => r.every(v => !isBlank(v)))
}
