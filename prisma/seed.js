// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // =======================
  // CATEGORÍAS
  // =======================
  await prisma.categoria.createMany({
    data: [
      { nombre: 'Iluminacion' },
      { nombre: 'Seguridad y Acceso' },
      { nombre: 'Sensores y Control Ambiental' },
      { nombre: 'Controladores y Automatizacion' },
      { nombre: 'Estilo de Vida y Entretenimiento' },
      { nombre: 'Domotica para Exterior' },
    ],
    skipDuplicates: true,
  });

  // =======================
  // PRODUCTOS (con imagen)
  // =======================
  await prisma.producto.createMany({
    data: [
      {
        nombre: 'Foco Inteligente WiFi',
        categoria: 'Iluminacion',
        marca: 'Tuya',
        precio: 199,
        cantidad_stock: 120,
        activo: true,
      },
      {
        nombre: 'Camara IP Seguridad 360°',
        categoria: 'Seguridad y Acceso',
        marca: 'Ezviz',
        precio: 1499,
        cantidad_stock: 25,
        activo: true,
      },
      {
        nombre: 'Cerradura Smart Bluetooth',
        categoria: 'Seguridad y Acceso',
        marca: 'August',
        precio: 2499,
        cantidad_stock: 10,
        activo: true,
      },
      {
        nombre: 'Tira LED RGB WiFi 5m',
        categoria: 'Iluminacion',
        marca: 'Govee',
        precio: 699,
        cantidad_stock: 40,
        activo: true,
      },
      {
        nombre: 'Sensor de Movimiento Zigbee',
        categoria: 'Sensores y Control Ambiental',
        marca: 'Aqara',
        precio: 999,
        cantidad_stock: 30,
        activo: true,
      },
      {
        nombre: 'Hub Domotico Universal',
        categoria: 'Controladores y Automatizacion',
        marca: 'Tuya',
        precio: 899,
        cantidad_stock: 15,
        activo: true,
      },
    ],
    skipDuplicates: true,
  });

  // =======================
  // CLIENTE DE PRUEBA
  // =======================
  await prisma.cliente.upsert({
    where: { correo: 'cliente@stern.com' },
    update: {},
    create: {
      nombre: 'Cliente Demo',
      correo: 'cliente@stern.com',
      telefono: '555-000-0000',
      ciudad: 'Hermosillo',
      region: 'Sonora',
      pais: 'MX',
      activo: true,
    },
  });

  console.log('✅ Seed completado con productos e imágenes locales');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
