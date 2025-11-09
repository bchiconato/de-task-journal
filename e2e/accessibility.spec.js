/**
 * @fileoverview Accessibility E2E tests
 */
import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should have skip link that works with keyboard', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('Tab');
    const skipLink = page.getByText('Skip to main content');
    await expect(skipLink).toBeFocused();
    
    await skipLink.click();
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    
    const h2s = page.getByRole('heading', { level: 2 });
    await expect(h2s.first()).toBeVisible();
  });

  test('should have proper ARIA labels on buttons', async ({ page }) => {
    await page.goto('/');
    
    const generateButton = page.getByRole('button', { name: /generate documentation/i });
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toHaveAccessibleName(/generate documentation/i);
  });

  test('should have focus visible styles', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    const ringVisible = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
    
    expect(ringVisible).toBe(true);
  });
});