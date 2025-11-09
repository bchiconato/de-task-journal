/**
 * @fileoverview Documentation generation flow E2E tests
 */
import { test, expect } from '@playwright/test';

test.describe('Documentation Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should switch between documentation modes', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /task/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /architecture/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /meeting/i })).toBeVisible();
    
    await page.getByRole('tab', { name: /architecture/i }).click();
    await expect(page).toHaveURL(/mode=architecture/);
    
    await page.getByRole('tab', { name: /meeting/i }).click();
    await expect(page).toHaveURL(/mode=meeting/);
  });

  test('should generate task documentation', async ({ page }) => {
    const contextText = 'Implemented new authentication system using JWT tokens. Added login and logout functionality with secure token storage. Challenges included handling token refresh and managing session expiration properly.';
    
    await page.fill('#context', contextText);
    
    await page.getByRole('button', { name: /Generate Documentation/i }).click();
    
    await expect(page.locator('.prose')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/generated documentation/i)).toBeVisible();
  });

  test('should enable edit mode for generated documentation', async ({ page }) => {
    const contextText = 'Test context for edit mode feature validation with enough characters to pass minimum length requirements and trigger documentation generation successfully.';
    
    await page.fill('#context', contextText);
    await page.getByRole('button', { name: /Generate Documentation/i }).click();
    
    await expect(page.locator('.prose')).toBeVisible({ timeout: 15000 });
    
    const editButton = page.getByRole('button', { name: /edit documentation/i });
    await editButton.click();
    
    await expect(page.locator('textarea[placeholder*="Write"]')).toBeVisible();
  });

  test('should validate minimum content length before sending', async ({ page }) => {
    const shortText = 'Short text for validation testing purposes only';
    
    await page.fill('#context', shortText);
    await page.getByRole('button', { name: /Generate Documentation/i }).click();
    
    await expect(page.locator('.prose')).toBeVisible({ timeout: 15000 });
    
    await expect(page.getByText(/content must be at least 100 characters/i)).toBeVisible();
    
    const sendButton = page.getByRole('button', { name: /Send to/i });
    await expect(sendButton).toBeDisabled();
  });
});