/**
 * @fileoverview Write mode selector E2E tests for Confluence
 */
import { test, expect } from '@playwright/test';

test.describe('Write Mode Selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    const platformButton = page.getByRole('radio', { name: /confluence/i });
    await platformButton.click();
  });

  test('should show write mode selector for Confluence', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /write mode/i })).toBeVisible();
    await expect(page.getByText(/append/i).first()).toBeVisible();
    await expect(page.getByText(/overwrite/i).first()).toBeVisible();
  });

  test('should switch between append and overwrite modes', async ({ page }) => {
    const appendOption = page.locator('#writeMode-append');
    const overwriteOption = page.locator('#writeMode-overwrite');
    
    await expect(appendOption).toBeChecked();
    
    await overwriteOption.click();
    await expect(overwriteOption).toBeChecked();
    await expect(appendOption).not.toBeChecked();
    
    await appendOption.click();
    await expect(appendOption).toBeChecked();
    await expect(overwriteOption).not.toBeChecked();
  });

  test('should show warning for overwrite mode', async ({ page }) => {
    const overwriteOption = page.locator('#writeMode-overwrite');
    await overwriteOption.click();
    
    await expect(page.getByText(/you will be asked to confirm before replacing content/i)).toBeVisible();
  });
});