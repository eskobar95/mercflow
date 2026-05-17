import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import { createMercflowAdminRouter } from "./appRouter"
import "./index.css"

const el = document.getElementById("root")
if (!el) {
  throw new Error("Root element #root not found")
}

const router = createMercflowAdminRouter()

createRoot(el).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
