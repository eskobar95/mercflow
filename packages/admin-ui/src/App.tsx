import { lazy } from "react"
import { Route, Routes } from "react-router-dom"

import { AdminShell } from "@/components/layout/AdminShell"

const HomePage = lazy(async () => {
  const m = await import("@/pages/HomePage")
  return { default: m.HomePage }
})

export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<AdminShell />}>
        <Route index element={<HomePage />} />
      </Route>
    </Routes>
  )
}
