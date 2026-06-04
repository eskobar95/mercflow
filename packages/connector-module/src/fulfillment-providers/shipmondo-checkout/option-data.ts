/**
 * Keys stored on shipping option `data` for {@link ShipmondoCheckoutFulfillmentProviderService}.
 * Admin operators copy `productCode` and `basePriceMinor` from the Shipmondo carrier catalogue.
 */
export const MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA = {
  productCode: "mercflow_shipmondo_product_code",
  basePriceMinor: "mercflow_shipmondo_base_price_minor",
} as const
