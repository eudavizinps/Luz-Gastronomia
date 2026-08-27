const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { "Cache-Control": "no-store" }
});

const normalizeCpf = value => String(value || "").replace(/\D/g, "");

const isValidCpf = cpf => {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = length => {
    const sum = cpf.slice(0, length - 1).split("").reduce(
      (total, value, index) => total + Number(value) * (length - index),
      0
    );
    const result = (sum * 10) % 11;
    return result === 10 ? 0 : result;
  };
  return digit(10) === Number(cpf[9]) && digit(11) === Number(cpf[10]);
};

const labelFor = rate => rate === 10
  ? "10% de desconto na primeira compra"
  : rate === 5
    ? "5% de desconto na segunda compra"
    : "Sem desconto disponível para este CPF";

const cpfHash = async (cpf, secret) => {
  if (!secret) throw new Error("Configuração de segurança indisponível.");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(cpf));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, "0")).join("");
};

export async function onRequestPost(context) {
  try {
    const { cpf: rawCpf, action = "quote", orderId } = await context.request.json();
    const cpf = normalizeCpf(rawCpf);
    if (!isValidCpf(cpf)) return json({ error: "CPF inválido." }, 400);
    if (!['quote', 'reserve'].includes(action)) return json({ error: "Ação inválida." }, 400);

    const hash = await cpfHash(cpf, context.env.CPF_HASH_SALT);
    const database = context.env.DISCOUNTS_DB;
    if (!database) throw new Error("Banco de dados indisponível.");

    if (action === "quote") {
      const result = await database.prepare(
        "SELECT COUNT(*) AS uses FROM discount_reservations WHERE cpf_hash = ? AND rate > 0"
      ).bind(hash).first();
      const rate = result?.uses === 0 ? 10 : result?.uses === 1 ? 5 : 0;
      return json({ rate, label: labelFor(rate) });
    }

    if (!/^[a-zA-Z0-9-]{16,80}$/.test(String(orderId || ""))) {
      return json({ error: "Identificador do pedido inválido." }, 400);
    }

    const existing = await database.prepare(
      "SELECT rate, label, order_id AS orderId FROM discount_reservations WHERE order_id = ?"
    ).bind(orderId).first();
    if (existing) return json(existing);

    const reserved = await database.prepare(`
      INSERT INTO discount_reservations (order_id, cpf_hash, rate, label)
      SELECT
        ?, ?,
        CASE
          WHEN COUNT(*) FILTER (WHERE rate > 0) = 0 THEN 10
          WHEN COUNT(*) FILTER (WHERE rate > 0) = 1 THEN 5
          ELSE 0
        END,
        CASE
          WHEN COUNT(*) FILTER (WHERE rate > 0) = 0 THEN '10% de desconto na primeira compra'
          WHEN COUNT(*) FILTER (WHERE rate > 0) = 1 THEN '5% de desconto na segunda compra'
          ELSE 'Sem desconto disponível para este CPF'
        END
      FROM discount_reservations
      WHERE cpf_hash = ?
      RETURNING rate, label, order_id AS orderId
    `).bind(orderId, hash, hash).first();

    if (reserved) return json(reserved);

    const concurrentReservation = await database.prepare(
      "SELECT rate, label, order_id AS orderId FROM discount_reservations WHERE order_id = ?"
    ).bind(orderId).first();
    if (concurrentReservation) return json(concurrentReservation);
    return json({ error: "Não foi possível confirmar o desconto. Tente novamente." }, 409);
  } catch (error) {
    console.error("discount function error", error);
    return json({ error: "Não foi possível consultar o benefício agora." }, 500);
  }
}

export const onRequest = () => json({ error: "Método não permitido." }, 405);
