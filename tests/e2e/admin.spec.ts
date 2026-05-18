import { test, expect } from '@playwright/test'

test('Admin login page has username and password fields', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/login')
  await expect(page.locator('#username')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
})
