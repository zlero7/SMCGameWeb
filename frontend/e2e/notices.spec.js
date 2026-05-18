import { test, expect } from '@playwright/test'

test.describe('Notices Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays loading state', async ({ page }) => {
    // Should show loading initially
    const loading = page.locator('.loading')
    await expect(loading).toBeVisible()
  })

  test('displays notices when loaded', async ({ page }) => {
    // Wait for either notices or empty message
    await page.waitForSelector('.notice-list li, :text("등록된 공지사항이 없습니다")', { timeout: 5000 })
  })

  test('can navigate back to notices from other pages', async ({ page }) => {
    await page.getByRole('link', { name: '취업' }).click()
    await expect(page).toHaveURL('/careers')
    
    await page.getByRole('link', { name: '공지사항' }).click()
    await expect(page).toHaveURL('/')
  })
})
