import { expect, test } from "@playwright/test"

test("admin shell loads", async ({ page }): Promise<void> => {
  await page.goto("/")

  await expect(page).toHaveTitle(/MercFlow Admin/i)
  await expect(page.getByRole("heading", { name: "Design token integration" })).toBeVisible()
})
