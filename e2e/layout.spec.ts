import { test, expect, type Page } from '@playwright/test'
import { DEMO, login } from './helpers'

async function fitsViewport(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
}

for (const width of [360, 768, 1280, 1920]) {
  test(`responsive student flow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/login')
    await fitsViewport(page)
    await page.screenshot({ path: `test-results/responsive/login-${width}.png`, fullPage: true })
    await login(page, DEMO.student)
    await expect(page.getByTestId('module-spaces')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Volver', exact: true })).toHaveCount(0)
    await expect(page.locator('header')).toHaveCSS('background-color', 'rgb(26, 54, 93)')
    await page.screenshot({ path: `test-results/responsive/modules-${width}.png`, fullPage: true })
    await fitsViewport(page)
    await page.getByTestId('module-spaces').click()
    await expect(page.getByTestId('lab-count')).toBeVisible()
    const main = await page.getByRole('main').boundingBox()
    expect(main!.width).toBeGreaterThanOrEqual(width >= 1024 ? width - 241 : width - 1)
    const cards = page.getByRole('main').locator('a[href^="/laboratories/"]')
    const first = await cards.nth(0).boundingBox(), second = await cards.nth(1).boundingBox()
    if (width >= 768) expect(Math.abs(first!.y - second!.y)).toBeLessThan(2)
    else expect(second!.y).toBeGreaterThan(first!.y)
    const nav = page.getByRole('navigation', { name: 'Navegación principal' })
    const box = await nav.boundingBox()
    if (width >= 1024) { expect(box!.x).toBe(0); expect(box!.width).toBeLessThan(281); expect(main!.x).toBeGreaterThanOrEqual(box!.width) }
    else expect(box!.y).toBeGreaterThan(700)
    await fitsViewport(page)
    await nav.getByRole('link', { name: 'Horarios', exact: true }).click()
    await expect(page.getByTestId('legend')).toBeVisible()
    await fitsViewport(page)
    await page.screenshot({ path: `test-results/responsive/availability-${width}.png`, fullPage: width >= 768 })
    await page.goto('/laboratories')
    await page.screenshot({ path: `test-results/responsive/catalog-${width}.png`, fullPage: width >= 768 })
  })
}

test('desktop professor and admin retain their working controls', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await login(page, DEMO.prof)
  await page.goto('/reservations/new')
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
  await page.getByLabel('Laboratorio', { exact: true }).selectOption({ label: 'Lab. Bases de Datos · 26 pers.' })
  await expect(page.getByTestId('pick-slot-1')).toHaveAttribute('data-status', 'free')
  await expect(page.getByRole('button', { name: 'Enviar solicitud' })).toBeVisible()
  await fitsViewport(page)
  await page.screenshot({ path: 'test-results/responsive/reservation-1280.png', fullPage: true })
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login/)
  await login(page, DEMO.admin)
  await page.goto('/admin/reservations')
  await expect(page.getByTestId('count-all')).toBeVisible()
  await page.getByLabel('Buscar', { exact: true }).fill('no-existe-responsive')
  await page.getByLabel('Buscar', { exact: true }).press('Enter')
  await expect(page.getByText('Sin resultados', { exact: true })).toBeVisible()
  await fitsViewport(page)
  await page.screenshot({ path: 'test-results/responsive/admin-1280.png', fullPage: true })
})

for (const width of [320, 640]) {
  test(`small screens and reflow keep navigation and QR usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await login(page, DEMO.student)
    await fitsViewport(page)
    await page.goto('/laboratories')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('main')).toBeFocused()
    await page.goto('/scan')
    await expect(page.getByTestId('scanner-viewport')).toBeVisible()
    await expect(page.getByRole('button', { name: /cámara/ })).toBeVisible()
    await fitsViewport(page)
    await page.screenshot({ path: `test-results/responsive/scan-${width}.png`, fullPage: true })
  })
}
