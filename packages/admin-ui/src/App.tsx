import { lazy } from "react"
import { Route, Routes } from "react-router-dom"

import { AdminShell } from "@/components/layout/AdminShell"

const HomePage = lazy(async () => {
  const m = await import("@/pages/HomePage")
  return { default: m.HomePage }
})

const ListDemoPage = lazy(async () => {
  const m = await import("@/pages/ListDemoPage")
  return { default: m.ListDemoPage }
})

const ProductNewPage = lazy(async () => {
  const m = await import("@/pages/ProductNewPage")
  return { default: m.ProductNewPage }
})

const ProductListPage = lazy(async () => {
  const m = await import("@/pages/ProductListPage")
  return { default: m.ProductListPage }
})

const ProductDetailPage = lazy(async () => {
  const m = await import("@/pages/ProductDetailPage")
  return { default: m.ProductDetailPage }
})

const ProductCategoryNewPage = lazy(async () => {
  const m = await import("@/pages/ProductCategoryNewPage")
  return { default: m.ProductCategoryNewPage }
})

const ProductCategoryListPage = lazy(async () => {
  const m = await import("@/pages/ProductCategoryListPage")
  return { default: m.ProductCategoryListPage }
})

const ProductCategoryDetailPage = lazy(async () => {
  const m = await import("@/pages/ProductCategoryDetailPage")
  return { default: m.ProductCategoryDetailPage }
})

export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<AdminShell />}>
        <Route index element={<HomePage />} />
        <Route path="products/new" element={<ProductNewPage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route
          path="product-categories/new"
          element={<ProductCategoryNewPage />}
        />
        <Route
          path="product-categories/:categoryId"
          element={<ProductCategoryDetailPage />}
        />
        <Route
          path="product-categories"
          element={<ProductCategoryListPage />}
        />
        <Route path="list-demo" element={<ListDemoPage />} />
      </Route>
    </Routes>
  )
}
