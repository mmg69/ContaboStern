// scripts/backfill_images.js
import { PrismaClient } from '@prisma/client';
import { resolveLocalImageUrlByName } from '../lib/images.js';

const prisma = new PrismaClient();

async function main() {
  const prods = await prisma.producto.findMany({
    where: { OR: [{ image_url: null }, { image_url: '' }] },
    select: { product_id: true, nombre: true, image_url: true },
  });

  let updated = 0;
  for (const p of prods) {
    const url = resolveLocalImageUrlByName(p.nombre);
    if (url) {
      await prisma.producto.update({
        where: { product_id: p.product_id },
        data: { image_url: url },
      });
      updated++;
      console.log(`✅ ${p.product_id} - ${p.nombre} -> ${url}`);
    } else {
      console.log(`⚠️  ${p.product_id} - ${p.nombre} -> sin archivo`);
    }
  }

  console.log(`Listo. Actualizados: ${updated}/${prods.length}`);
}

main().finally(() => prisma.$disconnect());
