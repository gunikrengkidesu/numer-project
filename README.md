# Numerical Methods Calculator (Vue 3 + Vite + Express + PostgreSQL)

## เริ่มใช้งาน
    docker compose up -d        # PostgreSQL (หรือใช้ PostgreSQL ของคุณเอง แล้วตั้ง DATABASE_URL)
    npm install
    npm run server              # API  → http://localhost:3000 (สร้างตาราง history อัตโนมัติ)
    npm run dev                 # หน้าเว็บ → http://localhost:5173 (proxy /api ไปที่ :3000)

Production: `npm start` (build แล้วให้ Express เสิร์ฟทั้งเว็บและ API ที่ :3000)
ตั้งค่าได้ด้วยตัวแปร DATABASE_URL และ PORT (ดู .env.example เช่น `node --env-file=.env server/index.js`)

    npm test                    # ทดสอบอัลกอริทึม + API (ข้าม API test ถ้าไม่มี PostgreSQL)

## โครงสร้าง
- src/core/        คลาส OOP ของอัลกอริทึมทั้งหมด + registry.js
- src/db/          HistoryStore → ApiStore (ใช้อยู่, เรียก API) / LocalStore (ทางเลือก, localStorage)
- server/          Express + pg: app.js (routes), db.js (pool, schema), schema.sql
- src/components/, src/pages/  UI

## API (ส่งหัว X-Client-Id ทุกครั้ง — ใช้แยกประวัติของแต่ละเบราว์เซอร์)
- GET /api/history · POST /api/history · DELETE /api/history/:id · DELETE /api/history
