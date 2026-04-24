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

const ProductListPage = lazy(async () => {
  const m = await import("@/pages/ProductListPage")
  return { default: m.ProductListPage }
})

const ProductCategoryListPage = lazy(async () => {
  const m = await import("@/pages/ProductCategoryListPage")
  return { default: m.ProductCategoryListPage }
})

export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<AdminShell />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route
          path="product-categories"
          element={<ProductCategoryListPage />}
        />
        <Route path="list-demo" element={<ListDemoPage />} />
      </Route>
    </Routes>
  )
}
