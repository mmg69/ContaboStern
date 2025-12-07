// lib/images.js
import { slugify } from './slugify';

export function getProductImage(p, opts = {}) {
  const basePath = opts.basePath || '/products';
  const ext = (opts.ext || 'jpg').replace(/^\./, '');
  const placeholder = `${basePath}/placeholder.${ext}`;

  if (!p) return placeholder;

  // 1) Si viene URL directa o ruta desde la BD
  if (p.image_url) {
    const url = p.image_url.trim();

    // Si es absoluta (http/https), la regresamos tal cual
    if (/^https?:\/\//.test(url)) return url;

    // Si ya empieza con "/", asumimos ruta absoluta relativa al host
    if (url.startsWith('/')) return url;

    // Si es solo nombre de archivo, le anteponemos /products
    return `${basePath}/${url}`;
  }

  // 2) Compatibilidad con campo `img`
  if (p.img) {
    const img = p.img.trim();
    if (img.startsWith('/')) return img;
    return `${basePath}/${img}`;
  }

  // 3) Construir la ruta a partir del nombre (slug)
  const slug = slugify(p.nombre || '');
  if (slug) {
    return `${basePath}/${slug}.${ext}`;
  }

  // 4) Fallback
  return placeholder;
}
