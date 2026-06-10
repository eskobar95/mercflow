import type { MedusaContainer } from "@medusajs/framework"
import type {
  IOrderModuleService,
  OrderDetailDTO,
} from "@medusajs/framework/types"
import { createOrderFulfillmentWorkflow } from "@medusajs/core-flows"
import { Modules } from "@medusajs/framework/utils"

const E2E_ORDER_EMAIL = "e2e-buyer@mercflow.local"
/** Sandbox GLS pakkeshop near Aarhus 8000 — used by connector-module tests. */
const E2E_SHIPMONDO_SERVICE_POINT_ID = "95892"
const E2E_ORDER_METADATA = {
  mercflow_e2e: "shipmondo",
  shipmondo_service_point_id: E2E_SHIPMONDO_SERVICE_POINT_ID,
} as const

export async function seedShipmondoOrder(input: {
  container: MedusaContainer
  storeId: string
  regionId: string
  salesChannelId: string
  locationId: string
  variantId: string
  productId: string
  productTitle: string
  shippingOptionId: string
}): Promise<{ orderId: string; fulfillmentId: string }> {
  const orderModule = input.container.resolve(
    Modules.ORDER
  ) as IOrderModuleService

  const existingOrders = await orderModule.listOrders(
    {},
    { take: 50, order: { created_at: "DESC" } }
  )
  let orderId = existingOrders.find(
    (row) => row.email === E2E_ORDER_EMAIL && row.shipping_address !== undefined
  )?.id

  if (orderId === undefined) {
    const created = await orderModule.createOrders({
      region_id: input.regionId,
      email: E2E_ORDER_EMAIL,
      currency_code: "dkk",
      status: "pending",
      sales_channel_id: input.salesChannelId,
      metadata: { ...E2E_ORDER_METADATA },
    })
    orderId = created.id
  }

  await orderModule.updateOrders(orderId, {
    sales_channel_id: input.salesChannelId,
    metadata: { ...E2E_ORDER_METADATA },
    shipping_address: {
      first_name: "Jane",
      last_name: "Doe",
      address_1: "Modtagergade 2",
      city: "Aarhus",
      country_code: "dk",
      postal_code: "8000",
      phone: "+4587654321",
    },
  })

  let order = (await orderModule.retrieveOrder(orderId, {
    relations: ["items", "shipping_methods", "fulfillments"],
  })) as OrderDetailDTO

  if (order.items === undefined || order.items.length === 0) {
    await orderModule.createOrderLineItems(orderId, [
      {
        title: input.productTitle,
        variant_id: input.variantId,
        product_id: input.productId,
        quantity: 1,
        unit_price: 19900,
      },
    ])
    order = (await orderModule.retrieveOrder(orderId, {
      relations: ["items", "shipping_methods", "fulfillments"],
    })) as OrderDetailDTO
  }

  if (order.shipping_methods === undefined || order.shipping_methods.length === 0) {
    await orderModule.createOrderShippingMethods(orderId, [
      {
        name: "GLS Pakkeshop E2E",
        order_id: orderId,
        amount: 4900,
        shipping_option_id: input.shippingOptionId,
        data: { mercflow_shipmondo_product_code: "GLSDK_SD" },
      },
    ])
    order = (await orderModule.retrieveOrder(orderId, {
      relations: ["items", "shipping_methods", "fulfillments"],
    })) as OrderDetailDTO
  }

  const existingFulfillment = order.fulfillments?.[0]
  if (existingFulfillment !== undefined) {
    return { orderId, fulfillmentId: existingFulfillment.id }
  }

  const orderItemId = order.items?.[0]?.id
  if (orderItemId === undefined) {
    throw new Error("E2E order has no line items after module seed")
  }

  const { result: fulfillment } = await createOrderFulfillmentWorkflow(
    input.container
  ).run({
    input: {
      order_id: orderId,
      location_id: input.locationId,
      shipping_option_id: input.shippingOptionId,
      items: [{ id: orderItemId, quantity: 1 }],
    },
  })

  const fulfillmentId =
    typeof fulfillment === "object" &&
    fulfillment !== null &&
    "id" in fulfillment &&
    typeof fulfillment.id === "string"
      ? fulfillment.id
      : null

  if (fulfillmentId === null || fulfillmentId === "") {
    throw new Error("Fulfillment workflow did not return an id")
  }

  return { orderId, fulfillmentId }
}
