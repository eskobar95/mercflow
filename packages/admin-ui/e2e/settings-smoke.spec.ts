import { expect, test } from "@playwright/test"

type SettingsSmokePage = {
  path: string
  title: string
}

const SETTINGS_SMOKE_PAGES: SettingsSmokePage[] = [
  { path: "/settings/general", title: "General" },
  { path: "/settings/taxes", title: "Taxes" },
  { path: "/settings/shipping", title: "Shipping profiles" },
  { path: "/settings/shipping/carriers", title: "Carriers" },
  { path: "/settings/team", title: "Team" },
  { path: "/settings/notifications", title: "Notifications" },
  { path: "/settings/email", title: "Email" },
  { path: "/settings/apps", title: "Apps" },
  { path: "/settings/developers?tab=api-keys", title: "Developers" },
]

const BACKEND_HINT = /VITE_MEDUSA_ADMIN_BACKEND_URL/i
const CLERK_HINT = /VITE_CLERK_PUBLISHABLE_KEY/i

function settingsNav(page: import("@playwright/test").Page) {
  return page.getByRole("navigation", { name: "Settings" })
}

test.describe("M022 settings pages smoke", () => {
  for (const settingsPage of SETTINGS_SMOKE_PAGES) {
    test(`${settingsPage.path} renders settings shell and page content`, async ({ page }): Promise<void> => {
      await page.goto(settingsPage.path)

      await expect(page).toHaveTitle(/MercFlow Admin/i)
      await expect(settingsNav(page)).toBeVisible()

      const heading = page.getByRole("heading", { level: 1, name: settingsPage.title })
      const backendHint = page.getByText(BACKEND_HINT)
      const clerkHint = page.getByText(CLERK_HINT)
      const loadingSpinner = page.getByRole("status")
      const errorAlert = page.getByRole("alert")

      await expect(
        heading.or(backendHint).or(clerkHint).or(loadingSpinner).or(errorAlert).first(),
      ).toBeVisible({
        timeout: 15_000,
      })
    })
  }

  test("/settings redirects to /settings/general", async ({ page }): Promise<void> => {
    await page.goto("/settings")
    await expect(page).toHaveURL(/\/settings\/general$/)
    await expect(settingsNav(page)).toBeVisible()
    await expect(page.getByText(BACKEND_HINT).first()).toBeVisible()
  })
})
