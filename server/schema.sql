CREATE TABLE IF NOT EXISTS history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  TEXT        NOT NULL,           -- แยกประวัติตามเบราว์เซอร์/ผู้ใช้
  ts         BIGINT      NOT NULL,           -- เวลาที่คำนวณ (ms)
  cat        TEXT        NOT NULL,           -- หมวด เช่น Root of Equation
  method     TEXT        NOT NULL,           -- วิธี เช่น Bisection
  input      JSONB       NOT NULL,           -- ค่าที่กรอก
  summary    TEXT        NOT NULL DEFAULT '', -- ผลลัพธ์แบบย่อ
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS history_client_ts ON history (client_id, ts DESC);
