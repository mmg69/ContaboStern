/*
  Warnings:

  - You are about to drop the `detalle_pedido` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `devoluciones` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "stern"."detalle_pedido" DROP CONSTRAINT "detalle_pedido_order_id_fkey";

-- DropForeignKey
ALTER TABLE "stern"."detalle_pedido" DROP CONSTRAINT "detalle_pedido_product_id_fkey";

-- DropForeignKey
ALTER TABLE "stern"."devoluciones" DROP CONSTRAINT "devoluciones_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "stern"."devoluciones" DROP CONSTRAINT "devoluciones_order_id_fkey";

-- DropForeignKey
ALTER TABLE "stern"."devoluciones" DROP CONSTRAINT "devoluciones_product_id_fkey";

-- DropIndex
DROP INDEX "stern"."pedidos_customer_id_idx";

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "productoProduct_id" BIGINT,
ALTER COLUMN "total" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "categoriaCategoria_id" BIGINT;

-- DropTable
DROP TABLE "stern"."detalle_pedido";

-- DropTable
DROP TABLE "stern"."devoluciones";

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaCategoria_id_fkey" FOREIGN KEY ("categoriaCategoria_id") REFERENCES "categorias"("categoria_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_productoProduct_id_fkey" FOREIGN KEY ("productoProduct_id") REFERENCES "productos"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;
