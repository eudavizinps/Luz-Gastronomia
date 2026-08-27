import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const normalizeCpf = value => String(value || "").replace(/\D/g, "");
const isValidCpf = cpf => {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = length => { const sum = cpf.slice(0, length - 1).split("").reduce((total, value, index) => total + Number(value) * (length - index), 0); const result = (sum * 10) % 11; return result === 10 ? 0 : result; };
  return digit(10) === Number(cpf[9]) && digit(11) === Number(cpf[10]);
};
const discountFor = uses => uses === 0 ? 10 : uses === 1 ? 5 : 0;
const labelFor = rate => rate === 10 ? "10% de desconto na primeira compra" : rate === 5 ? "5% de desconto na segunda compra" : "Sem desconto disponível para este CPF";
const cpfKey = cpf => `cpf-${createHash("sha256").update(cpf).digest("hex")}`;

export default async request => {
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  try {
    const { cpf: rawCpf, action = "quote", orderId } = await request.json();
    const cpf = normalizeCpf(rawCpf);
    if (!isValidCpf(cpf)) return json({ error: "CPF inválido." }, 400);
    if (!["quote", "reserve"].includes(action)) return json({ error: "Ação inválida." }, 400);

    const store = getStore({ name: "luz-cpf-discounts", consistency: "strong" });
    const key = cpfKey(cpf);
    if (action === "quote") {
      const entry = await store.get(key, { type: "json", consistency: "strong" });
      const rate = discountFor(entry?.uses || 0);
      return json({ rate, label: labelFor(rate) });
    }

    if (!/^[a-zA-Z0-9-]{16,80}$/.test(String(orderId || ""))) return json({ error: "Identificador do pedido inválido." }, 400);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const entry = await store.getWithMetadata(key, { type: "json", consistency: "strong" });
      const record = entry?.data || { uses: 0, reservations: {} };
      if (record.reservations[orderId]) return json(record.reservations[orderId]);

      const rate = discountFor(record.uses || 0);
      const result = { rate, label: labelFor(rate), orderId };
      record.reservations[orderId] = result;
      if (rate) record.uses += 1;
      const reservations = Object.entries(record.reservations).slice(-12);
      record.reservations = Object.fromEntries(reservations);
      try {
        const write = entry ? await store.setJSON(key, record, { onlyIfMatch: entry.etag }) : await store.setJSON(key, record, { onlyIfNew: true });
        if (write.modified) return json(result);
      } catch {
        // Outra finalização atualizou este CPF primeiro. Releia o registro e tente novamente.
      }
    }
    return json({ error: "Não foi possível confirmar o desconto. Tente novamente." }, 409);
  } catch (error) {
    console.error("discount function error", error);
    return json({ error: "Não foi possível consultar o benefício agora." }, 500);
  }
};
