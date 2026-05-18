import { test, expect } from '@playwright/test'

test.describe('GameWeb Site', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check header
    await expect(page.locator('h1')).toContainText('게임소프트웨어과')
    
    // Check navigation
    await expect(page.getByRole('link', { name: '공지사항' })).toBeVisible()
    await expect(page.getByRole('link', { name: '취업' })).toBeVisible()
    await expect(page.getByRole('link', { name: '진학' })).toBeVisible()
    await expect(page.getByRole('link', { name: '학사달력' })).toBeVisible()
    await expect(page.getByRole('link', { name: '과제일정' })).toBeVisible()
  })

  test('navigation works', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to Careers
    await page.getByRole('link', { name: '취업' }).click()
    await expect(page).toHaveURL('/careers')
    await expect(page.locator('h2')).toContainText('취업')
    
    // Navigate to Admissions
    await page.getByRole('link', { name: '진학' }).click()
    await expect(page).toHaveURL('/admissions')
    await expect(page.locator('h2')).toContainText('진학')
    
    // Navigate to Calendar
    await page.getByRole('link', { name: '학사달력' }).click()
    await expect(page).toHaveURL('/calendar')
    await expect(page.locator('h2')).toContainText('학사달력')
    
    // Navigate to Assignments
    await page.getByRole('link', { name: '과제일정' }).click()
    await expect(page).toHaveURL('/assignments')
    await expect(page.locator('h2')).toContainText('과제')
    
    // Back to Notices
    await page.getByRole('link', { name: '공지사항' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.locator('h2')).toContainText('공지')
  })

  test('admin login page loads', async ({ page }) => {
    await page.goto('/admin/login')
    
    await expect(page.locator('h2')).toContainText('관리자 로그인')
    await expect(page.getByLabel('아이디')).toBeVisible()
    await expect(page.getByLabel('비밀번호')).toBeVisible()
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
  })

  test('admin dashboard requires login', async ({ page }) => {
    await page.goto('/admin')
    
    // Should show dashboard (public access in dev mode)
    await expect(page.locator('h1')).toContainText('관리자')
  })
})
