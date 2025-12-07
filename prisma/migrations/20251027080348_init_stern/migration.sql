-- CreateTable
CREATE TABLE "categorias" (
    "categoria_id" BIGSERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("categoria_id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "customer_id" BIGSERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "ciudad" TEXT,
    "region" TEXT,
    "pais" TEXT,
    "fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "productos" (
    "product_id" BIGSERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "marca" TEXT,
    "precio" DECIMAL(65,30) NOT NULL,
    "cantidad_stock" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "order_id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "envio" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "detalle_pedido" (
    "order_item_id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotal_linea" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "detalle_pedido_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateTable
CREATE TABLE "devoluciones" (
    "return_id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "monto_reembolso" DECIMAL(65,30),
    "motivo" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'en_proceso',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("return_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_correo_key" ON "clientes"("correo");

-- CreateIndex
CREATE INDEX "pedidos_customer_id_idx" ON "pedidos"("customer_id");

-- CreateIndex
CREATE INDEX "detalle_pedido_order_id_idx" ON "detalle_pedido"("order_id");

-- CreateIndex
CREATE INDEX "detalle_pedido_product_id_idx" ON "detalle_pedido"("product_id");

-- CreateIndex
CREATE INDEX "devoluciones_order_id_idx" ON "devoluciones"("order_id");

-- CreateIndex
CREATE INDEX "devoluciones_product_id_idx" ON "devoluciones"("product_id");

-- CreateIndex
CREATE INDEX "devoluciones_customer_id_idx" ON "devoluciones"("customer_id");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "clientes"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "pedidos"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "productos"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "pedidos"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "productos"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "clientes"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;
