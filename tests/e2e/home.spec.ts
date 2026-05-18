import { test, expect } from '@playwright/test'

test('Homepage shows KPI tiles and notices label', async ({ page }) => {
  await page.goto('http://localhost:3000')
  // Expect exactly 4 KPI tiles
  const tiles = page.locator('.dashboard-tile')
  await expect(tiles).toHaveCount(4)
  // KPI label presence
  await expect(page.locator('text=공지')).toBeVisible()
})
