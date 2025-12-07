// lib/serialize.js

export function toPlain(data) {
  // Convierte BigInt -> Number para poder serializar en JSON/Next
  return JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? Number(v) : v))
  );
}
