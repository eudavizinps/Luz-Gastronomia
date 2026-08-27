CREATE TABLE IF NOT EXISTS discount_reservations (
  order_id TEXT PRIMARY KEY,
  cpf_hash TEXT NOT NULL,
  rate INTEGER NOT NULL CHECK (rate IN (0, 5, 10)),
  label TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discount_reservations_cpf_hash
  ON discount_reservations (cpf_hash, rate);
