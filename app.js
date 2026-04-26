/**
 * Demo Shop — app.js
 *
 * Covers:
 *  - Login / logout with hardcoded credentials
 *  - Intentional bug: username "admin" accepted with any password
 *  - Add-to-cart (both .add-to-cart and .add-to-cart-typo buttons)
 *  - Cart rendering, item removal, total calculation
 *  - Checkout flow → success screen
 */

'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VALID_USERNAME = 'test_user';
const VALID_PASSWORD = 'password123';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let currentUser = null;
/** @type {Array<{id: string, name: string, price: number}>} */
let cart = [];

// ---------------------------------------------------------------------------
// DOM references (resolved after DOMContentLoaded)
// ---------------------------------------------------------------------------
let loginSection, loginForm, usernameInput, passwordInput, loginError;
let shopSection, welcomeMsg, logoutBtn;
let cartEmptyMsg, cartItemsList, cartSummary, cartTotalEl;
let checkoutBtn;
let successSection, successMessage, continueShoppingBtn;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Resolve DOM refs
  loginSection      = document.getElementById('login-section');
  loginForm         = document.getElementById('login-form');
  usernameInput     = document.getElementById('username');
  passwordInput     = document.getElementById('password');
  loginError        = document.getElementById('login-error');

  shopSection       = document.getElementById('shop-section');
  welcomeMsg        = document.getElementById('welcome-msg');
  logoutBtn         = document.getElementById('logout-btn');

  cartEmptyMsg      = document.getElementById('cart-empty');
  cartItemsList     = document.getElementById('cart-items');
  cartSummary       = document.getElementById('cart-summary');
  cartTotalEl       = document.getElementById('cart-total');
  checkoutBtn       = document.getElementById('checkout-btn');

  successSection    = document.getElementById('success-section');
  successMessage    = document.getElementById('success-message');
  continueShoppingBtn = document.getElementById('continue-shopping-btn');

  // Wire up events
  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  checkoutBtn.addEventListener('click', handleCheckout);
  continueShoppingBtn.addEventListener('click', handleContinueShopping);

  // Attach add-to-cart handlers for both button classes
  document.querySelectorAll('.add-to-cart, .add-to-cart-typo').forEach(btn => {
    btn.addEventListener('click', handleAddToCart);
  });
});

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Validates credentials.
 *
 * Intentional bug: username "admin" is accepted with ANY password.
 * Only test_user/password123 is the legitimate credential pair.
 *
 * @param {string} username
 * @param {string} password
 * @returns {boolean}
 */
function validateCredentials(username, password) {
  if (username === 'admin') {
    // BUG: admin bypasses password check entirely
    return true;
  }
  return username === VALID_USERNAME && password === VALID_PASSWORD;
}

/** @param {SubmitEvent} event */
function handleLogin(event) {
  event.preventDefault();
  loginError.textContent = '';

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    loginError.textContent = 'Please enter both username and password.';
    return;
  }

  if (validateCredentials(username, password)) {
    currentUser = username;
    showShop();
  } else {
    loginError.textContent = 'Invalid username or password.';
    passwordInput.value = '';
    passwordInput.focus();
  }
}

function handleLogout() {
  currentUser = null;
  cart = [];
  loginForm.reset();
  loginError.textContent = '';
  showLogin();
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

/** @param {MouseEvent} event */
function handleAddToCart(event) {
  const btn = event.currentTarget;
  const id    = btn.dataset.id;
  const name  = btn.dataset.name;
  const price = parseFloat(btn.dataset.price);

  cart.push({ id, name, price });
  renderCart();
}

/** @param {string} index — position in cart array as string */
function removeFromCart(index) {
  cart.splice(Number(index), 1);
  renderCart();
}

function renderCart() {
  cartItemsList.innerHTML = '';

  if (cart.length === 0) {
    cartEmptyMsg.classList.remove('hidden');
    cartSummary.classList.remove('hidden');
    cartTotalEl.textContent = '$0.00';
    return;
  }

  cartEmptyMsg.classList.add('hidden');
  cartSummary.classList.remove('hidden');

  let total = 0;

  cart.forEach((item, index) => {
    total += item.price;

    const li = document.createElement('li');
    li.className = 'cart-item';
    li.setAttribute('data-testid', `cart-item-${item.id}`);
    li.innerHTML = `
      <span class="cart-item-name">${escapeHtml(item.name)}</span>
      <span class="cart-item-price">$${item.price.toFixed(2)}</span>
      <button
        class="cart-item-remove"
        aria-label="Remove ${escapeHtml(item.name)} from cart"
        onclick="removeFromCart('${index}')"
      >&times;</button>
    `;
    cartItemsList.appendChild(li);
  });

  cartTotalEl.textContent = `$${total.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------
function handleCheckout() {
  if (cart.length === 0) {
    window.alert('Your cart is empty!');
    return;
  }

  const itemCount = cart.length;
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  successMessage.textContent =
    `Thank you, ${currentUser}! Your order of ${itemCount} item${itemCount > 1 ? 's' : ''} `
    + `totalling $${total.toFixed(2)} has been placed.`;

  cart = [];
  renderCart();
  showSuccess();
}

function handleContinueShopping() {
  showShop();
}

// ---------------------------------------------------------------------------
// View helpers
// ---------------------------------------------------------------------------
function showLogin() {
  loginSection.classList.remove('hidden');
  shopSection.classList.add('hidden');
  successSection.classList.add('hidden');
}

function showShop() {
  welcomeMsg.textContent = `Welcome, ${currentUser}`;
  loginSection.classList.add('hidden');
  shopSection.classList.remove('hidden');
  successSection.classList.add('hidden');
  renderCart(); // ensure cart UI reflects current state every time the shop is shown
}

function showSuccess() {
  loginSection.classList.add('hidden');
  shopSection.classList.add('hidden');
  successSection.classList.remove('hidden');
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Escapes HTML special characters to prevent XSS when inserting user-
 * controlled or external data via innerHTML.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
