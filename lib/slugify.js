// lib/slugify.js
export function slugify(text) {
  return text
    .toString()
    .normalize('NFKD') // Normaliza caracteres especiales
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Reemplaza espacios con -
    .replace(/[^\w\-]+/g, '') // Remueve caracteres no válidos
    .replace(/\-\-+/g, '-') // Reemplaza múltiples - con uno solo
    .replace(/^-+/, '') // Remueve - del inicio
    .replace(/-+$/, ''); // Remueve - del final
}
