/**
 * @fileoverview Confirm dialog E2E tests
 */
import { test, expect } from '@playwright/test';

test.describe('Confirm Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('radio', { name: /confluence/i }).click();
    await page.locator('#writeMode-overwrite').click();
    
    const contextText = 'Test documentation content for confirm dialog validation testing purposes. This needs to be long enough to pass the minimum character requirements for sending to Confluence. Adding more content here to ensure we meet the 100 character minimum requirement.';
    await page.fill('#context', contextText);
    await page.getByRole('button', { name: /Generate Documentation/i }).click();
    await expect(page.locator('.prose')).toBeVisible({ timeout: 15000 });
  });

  test('should show confirmation dialog before overwrite', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /Send to Confluence/i });
    await sendButton.click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/are you sure/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /confirm/i })).toBeVisible();
  });

  test('should cancel overwrite operation', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /Send to Confluence/i });
    await sendButton.click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
    
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should close dialog with Escape key', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /Send to Confluence/i });
    await sendButton.click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    
    await page.keyboard.press('Escape');
    
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});