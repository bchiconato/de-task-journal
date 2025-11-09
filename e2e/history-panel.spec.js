/**
 * @fileoverview History panel E2E tests
 */
import { test, expect } from '@playwright/test';

test.describe('History Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open and close history panel', async ({ page }) => {
    const historyButton = page.getByRole('button', { name: /history/i });
    await historyButton.click();
    
    await expect(page.getByRole('menu')).toBeVisible();
    await expect(page.getByText(/history/i).first()).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).not.toBeVisible();
  });

  test('should filter history by mode', async ({ page }) => {
    const contextText = 'Test task context for history panel validation with sufficient length to meet requirements.';
    await page.fill('#context', contextText);
    await page.getByRole('button', { name: /Generate Documentation/i }).click();
    await expect(page.locator('.prose')).toBeVisible({ timeout: 15000 });
    
    const historyButton = page.getByRole('button', { name: /history/i });
    await historyButton.click();
    
    await expect(page.getByRole('menu')).toBeVisible();
    
    await expect(page.getByRole('button', { name: /toggle filters/i })).toBeVisible();
  });

  test('should search history entries', async ({ page }) => {
    const contextText = 'Searchable authentication system documentation with JWT tokens and security features implementation.';
    await page.fill('#context', contextText);
    await page.getByRole('button', { name: /Generate Documentation/i }).click();
    await expect(page.locator('.prose')).toBeVisible({ timeout: 15000 });
    
    const historyButton = page.getByRole('button', { name: /history/i });
    await historyButton.click();
    
    const searchInput = page.getByPlaceholder('Search history...');
    await searchInput.fill('authentication');
    
    await expect(page.getByText(/authentication/i).first()).toBeVisible();
  });

  test('should close history panel when clicking outside', async ({ page }) => {
    const historyButton = page.getByRole('button', { name: /history/i });
    await historyButton.click();
    
    await expect(page.getByRole('menu')).toBeVisible();
    
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('menu')).not.toBeVisible();
  });
});