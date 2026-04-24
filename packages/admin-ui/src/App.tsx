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

export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<AdminShell />}>
        <Route index element={<HomePage />} />
        <Route path="list-demo" element={<ListDemoPage />} />
      </Route>
    </Routes>
  )
}
