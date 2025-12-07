// pages/api/products/index.js
import prisma from '../../../lib/server/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const products = await prisma.producto.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(products); // Return array directly
  } catch (err) {
    console.error('API /products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}
