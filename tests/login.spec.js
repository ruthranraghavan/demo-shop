// @ts-check
'use strict';

const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_URL = `file://${path.resolve(__dirname, '..', 'index.html')}`;

// ---------------------------------------------------------------------------
// Helper: fills and submits the login form
// ---------------------------------------------------------------------------
async function login(page, username, password) {
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('#login-btn');
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
test.describe('Login', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    // Confirm we start on the login page
    await expect(page.locator('#login-section')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 1. Valid login
  // -------------------------------------------------------------------------
  test('valid credentials (test_user / password123) should show the product list', async ({ page }) => {
    await login(page, 'test_user', 'password123');

    // Login form should disappear
    await expect(page.locator('#login-section')).toBeHidden();

    // Shop section should appear
    await expect(page.locator('#shop-section')).toBeVisible();

    // Both products should be visible
    await expect(page.locator('#product-laptop')).toBeVisible();
    await expect(page.locator('#product-smartphone')).toBeVisible();

    // Welcome message should include the username
    await expect(page.locator('#welcome-msg')).toContainText('test_user');
  });

  // -------------------------------------------------------------------------
  // 2. Invalid credentials
  // -------------------------------------------------------------------------
  test('wrong credentials should display an error message', async ({ page }) => {
    await login(page, 'wrong_user', 'wrongpassword');

    // Should still be on login page
    await expect(page.locator('#login-section')).toBeVisible();

    // Shop must remain hidden
    await expect(page.locator('#shop-section')).toBeHidden();

    // Error message must be visible and contain relevant text
    const errorMsg = page.locator('#login-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Invalid username or password');
  });

  // -------------------------------------------------------------------------
  // 3. Admin login — intentional bug: any password accepted for "admin"
  // -------------------------------------------------------------------------
  test('admin user is accepted with any password (intentional bug)', async ({ page }) => {
    await login(page, 'admin', 'totally_random_password_xyz');

    // Login form should disappear
    await expect(page.locator('#login-section')).toBeHidden();

    // Shop section should appear
    await expect(page.locator('#shop-section')).toBeVisible();

    // Both products should be visible
    await expect(page.locator('#product-laptop')).toBeVisible();
    await expect(page.locator('#product-smartphone')).toBeVisible();

    // Welcome message should include "admin"
    await expect(page.locator('#welcome-msg')).toContainText('admin');
  });

});
