import { test, expect } from '@playwright/test'

test.describe('Calendar Page', () => {
  test('calendar page loads', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.locator('h2')).toContainText('학사달력')
  })

  test('displays months', async ({ page }) => {
    await page.goto('/calendar')
    
    // Check for month names
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
    
    for (const month of months) {
      await expect(page.locator('h3', { hasText: month })).toBeVisible()
    }
  })
})
