import { expect, test } from "@playwright/test"

test("admin shell loads", async ({ page }): Promise<void> => {
  await page.goto("/")

  await expect(page).toHaveTitle(/MercFlow Admin/i)
  // Sidebar nav is always present — confirms the shell rendered correctly
  await expect(page.getByRole("link", { name: "Home" })).toBeVisible()
  // Home page workspace banner is visible
  await expect(page.getByText("Your workspace is ready")).toBeVisible()
})
