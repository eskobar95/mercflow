import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

import { CONNECTOR_MODULE } from "@mercflow/connector-module"
import { PACKAGING_MODULE } from "@mercflow/packaging-module"

import { registerTenantSubscribersOnContainer } from "../lib/tenant-isolation/register-tenant-subscribers-on-container"
import { TenantContext } from "../lib/tenant-isolation/tenant-context"
import { seedShipmondoOrder } from "./seed-shipmondo-order"

type SeedOutput = {
  store_id: string
  region_id: string
  product_id: string
  variant_id: string
  packaging_type_id: string
  order_id: string
  fulfillment_id: string
  admin_email: string
}

function readEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim()
  return value !== undefined && value !== "" ? value : fallback
}

export default async function seedShipmondoE2e({
  container,
}: ExecArgs): Promise<void> {
  const storeModule = container.resolve(Modules.STORE)
  const stores = await storeModule.listStores({}, { take: 1 })
  const store = stores[0]
  if (store === undefined) {
    throw new Error("No store found — run migrations first")
  }

  const storeId = store.id as string
  const tenantScopedModules = [
    Modules.PRODUCT,
    Modules.ORDER,
    Modules.CUSTOMER,
    Modules.FULFILLMENT,
    PACKAGING_MODULE,
    CONNECTOR_MODULE,
  ]
  registerTenantSubscribersOnContainer(container, tenantScopedModules)

  const shipmondoUser = readEnv("SHIPMONDO_API_USER", "")
  const shipmondoKey = readEnv("SHIPMONDO_API_KEY", "")
  if (shipmondoUser === "" || shipmondoKey === "") {
    throw new Error("SHIPMONDO_API_USER and SHIPMONDO_API_KEY required in env")
  }

  const regionModule = container.resolve(Modules.REGION)
  const existingRegions = await regionModule.listRegions({}, { take: 1 })
  const regionId = existingRegions[0]?.id as string | undefined
  if (regionId === undefined) {
    throw new Error("No region found — create a region via admin API first")
  }

  const output: SeedOutput = await TenantContext.run(storeId, async (): Promise<SeedOutput> => {

    const productModule = container.resolve(Modules.PRODUCT)
    const e2eHandle = "e2e-shipmondo-product"
    const existingProducts = await productModule.listProducts(
      { handle: e2eHandle },
      { relations: ["variants"], take: 1 }
    )
    let product = existingProducts[0]
    if (product === undefined) {
      const created = await productModule.createProducts({
        title: "E2E Shipmondo Product",
        handle: e2eHandle,
        status: "published",
        options: [{ title: "Size", values: ["Default"] }],
        variants: [
          {
            title: "Default",
            sku: "E2E-SHIP-1",
            options: { Size: "Default" },
            weight: 750,
            length: 100,
            width: 80,
            height: 50,
            manage_inventory: false,
          },
        ],
      })
      product = Array.isArray(created) ? created[0] : created
    }

    const productWithVariants =
      product.variants !== undefined && product.variants.length > 0
        ? product
        : await productModule.retrieveProduct(product.id, { relations: ["variants"] })
    const variantId = productWithVariants.variants?.[0]?.id
    if (productWithVariants.id === undefined || variantId === undefined) {
      throw new Error("Failed to resolve E2E product variant")
    }

    const packagingService = container.resolve(PACKAGING_MODULE) as {
      listPackagingTypes: (
        storeId: string,
        input: { limit?: number }
      ) => Promise<{ packaging_types: Array<{ id: string; name: string }> }>
      createPackagingType: (
        storeId: string,
        input: {
          name: string
          type: string
          length_mm: number
          width_mm: number
          height_mm: number
          max_weight_g: number
          is_active: boolean
        }
      ) => Promise<{ id: string }>
    }
    const e2ePackagingName = "E2E Medium Box"
    const existingPackaging = await packagingService.listPackagingTypes(storeId, {
      limit: 50,
    })
    let packagingTypeId = existingPackaging.packaging_types.find(
      (row) => row.name === e2ePackagingName
    )?.id
    if (packagingTypeId === undefined) {
      const created = await packagingService.createPackagingType(storeId, {
        name: e2ePackagingName,
        type: "box",
        length_mm: 300,
        width_mm: 200,
        height_mm: 100,
        max_weight_g: 2000,
        is_active: true,
      })
      packagingTypeId = created.id
    }

    const connectorService = container.resolve(CONNECTOR_MODULE) as {
      patchShipmondo: (body: Record<string, unknown>) => Promise<unknown>
    }
    await connectorService.patchShipmondo({
      api_user: shipmondoUser,
      api_key: shipmondoKey,
      active: true,
      senderName: "MercFlow Test Sender",
      senderAddress1: "Testvej 1",
      senderPostalCode: "2100",
      senderCity: "Copenhagen",
      senderCountryCode: "DK",
      senderEmail: "sender-test@mercflow.local",
      senderPhone: "+4512345678",
      labelFormat: "10x19_pdf",
      ownAgreement: false,
    })

    const shippingOptionId = readEnv(
      "E2E_SHIPPING_OPTION_ID",
      "so_01KTS38E2PZZ627C393XXMZB6S"
    )
    const locationId = store.default_location_id as string | null
    if (locationId === null || locationId === "") {
      throw new Error("Store default_location_id is not set")
    }

    const salesChannelId = store.default_sales_channel_id as string | null
    if (salesChannelId === null || salesChannelId === "") {
      throw new Error("Store default_sales_channel_id is not set")
    }

    const { orderId, fulfillmentId } = await seedShipmondoOrder({
      container,
      storeId,
      regionId,
      salesChannelId,
      locationId,
      variantId,
      productId: productWithVariants.id,
      productTitle: "E2E Shipmondo Product",
      shippingOptionId,
    })

    return {
      store_id: storeId,
      region_id: regionId,
      product_id: productWithVariants.id,
      variant_id: variantId,
      packaging_type_id: packagingTypeId,
      order_id: orderId,
      fulfillment_id: fulfillmentId,
      admin_email: readEnv("E2E_ADMIN_EMAIL", "admin@mercflow.local"),
    }
  })

  process.stdout.write(`${JSON.stringify(output)}\n`)
}
