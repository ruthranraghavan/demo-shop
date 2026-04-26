// @ts-check
'use strict';

const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_URL = `file://${path.resolve(__dirname, '..', 'index.html')}`;

// ---------------------------------------------------------------------------
// Helper: fills and submits the login form
// ---------------------------------------------------------------------------
async function login(page, username = 'test_user', password = 'password123') {
  await page.goto(APP_URL);
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('#login-btn');
  // Wait for shop to be visible before continuing
  await expect(page.locator('#shop-section')).toBeVisible();
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
test.describe('Checkout', () => {

  // -------------------------------------------------------------------------
  // 1. Add both products and checkout → success screen
  // -------------------------------------------------------------------------
  test('adding Laptop and Smartphone then checking out shows the success screen', async ({ page }) => {
    await login(page);

    // Add Laptop using the standard class
    const laptopBtn = page.locator('.add-to-cart[data-id="laptop"]');
    await expect(laptopBtn).toBeVisible();
    await laptopBtn.click();

    // Add Smartphone using the intentionally different class (add-to-cart-typo)
    const smartphoneBtn = page.locator('.add-to-cart-typo[data-id="smartphone"]');
    await expect(smartphoneBtn).toBeVisible();
    await smartphoneBtn.click();

    // Both items should appear in the cart list
    await expect(page.locator('[data-testid="cart-item-laptop"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-item-smartphone"]')).toBeVisible();

    // Total should reflect both items ($999 + $499 = $1498)
    await expect(page.locator('#cart-total')).toContainText('$1498.00');

    // Click checkout
    await page.click('#checkout-btn');

    // Success section must be visible; shop must be hidden
    await expect(page.locator('#success-section')).toBeVisible();
    await expect(page.locator('#shop-section')).toBeHidden();

    // Success message should mention the user and total
    await expect(page.locator('#success-message')).toContainText('test_user');
    await expect(page.locator('#success-message')).toContainText('$1498.00');

    // Verify "Continue Shopping" brings back the shop
    await page.click('#continue-shopping-btn');
    await expect(page.locator('#shop-section')).toBeVisible();
    await expect(page.locator('#success-section')).toBeHidden();
  });

  // -------------------------------------------------------------------------
  // 2. Checkout with an empty cart → alert dialog
  // -------------------------------------------------------------------------
  test('checking out with an empty cart shows an alert dialog', async ({ page }) => {
    await login(page);

    // Cart is empty at this point; cart-summary is visible (checkout button is always shown)
    await expect(page.locator('#cart-summary')).toBeVisible();
    await expect(page.locator('#cart-empty')).toBeVisible();

    // Register a one-time dialog handler BEFORE the click so Playwright can
    // accept the alert immediately and unblock the click action.
    let alertType = '';
    let alertMessage = '';
    page.once('dialog', async dialog => {
      alertType = dialog.type();
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.click('#checkout-btn');

    expect(alertType).toBe('alert');
    expect(alertMessage).toBe('Your cart is empty!');

    // Should still be on the shop page (no navigation away)
    await expect(page.locator('#shop-section')).toBeVisible();
    await expect(page.locator('#success-section')).toBeHidden();
  });

});
