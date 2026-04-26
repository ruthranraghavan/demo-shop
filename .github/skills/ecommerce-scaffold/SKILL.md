---
name: ecommerce-scaffold
description: >
  Scaffold a complete multi-file vanilla HTML/CSS/JS demo e-commerce web app with login,
  product listing, cart, and checkout flow — plus Playwright test config. Use this skill
  whenever the user asks to generate, scaffold, or create a demo e-commerce site, storefront,
  or shopping cart app using plain HTML, CSS, and JavaScript (no frameworks). Also trigger
  when the user mentions generating multiple files at once for a frontend demo, or when they
  need a Playwright-ready test harness alongside a vanilla web app.
---

# E-Commerce Scaffold Skill

## Overview

Generate a complete, self-contained demo e-commerce web app across **5 files**:

| File | Purpose |
|---|---|
| `index.html` | App shell: login form, product list, cart, success sections |
| `styles.css` | Clean layout with intentional CSS class inconsistency |
| `app.js` | Login logic (with intentional bugs), cart, checkout |
| `package.json` | Playwright devDependency + test scripts |
| `.gitignore` | Standard exclusions |

---

## CRITICAL RULES FOR OLDER/WEAKER MODELS

> These rules exist because GPT-4o and similar models tend to truncate, skip files, or produce placeholder content. Follow them without exception.

1. **Output ALL 5 files in one response.** Never say "I'll generate the rest in a follow-up."
2. **Each file must be wrapped in a fenced code block with its filename as the label.** Example:
   ````
   ```html
   <!-- index.html -->
   ...full content...
   ```
   ````
3. **No placeholders.** Never write `// TODO`, `/* add styles here */`, `...`, or `[rest of code]`. Every function, style, and element must be complete and functional.
4. **No truncation.** If the response is long, keep going. Do not summarize or skip sections.
5. **Preserve intentional bugs exactly as specified.** Do not "fix" them.

---

## File Specifications

### 1. `index.html`

Structure the page with four sections, only one visible at a time:

```
#login-section     → shown by default
#products-section  → shown after login
#cart-section      → shown when cart is opened
#success-section   → shown after checkout
```

**Login form** (`#login-section`):
- `<input id="username">` and `<input id="password" type="password">`
- `<button id="login-btn">Login</button>`
- `<p id="login-error" style="color:red; display:none;">Invalid credentials</p>`

**Product list** (`#products-section`):
- Two product cards:
  - Laptop — $999 — button with class `add-to-cart`
  - Smartphone — $499 — button with class `add-to-cart-typo` ← intentional inconsistency, do NOT change this
- `<button id="view-cart-btn">View Cart</button>`
- `<span id="cart-count">0</span>` showing item count

**Cart section** (`#cart-section`):
- `<ul id="cart-items">` listing added products
- `<p id="cart-total">Total: $0</p>`
- `<button id="checkout-btn">Checkout</button>`
- `<button id="back-btn">Back to Products</button>`

**Success section** (`#success-section`):
- Thank-you message: "Order placed successfully!"
- `<button id="restart-btn">Shop Again</button>` that resets to login

Link both `styles.css` and `app.js`.

---

### 2. `styles.css`

Produce a clean, readable layout. Include ALL of the following:

```css
/* Reset */
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: sans-serif; background: #f5f5f5; display: flex; justify-content: center; padding: 40px 20px; }
.container { background: white; padding: 32px; border-radius: 8px; max-width: 600px; width: 100%; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
h1 { margin-bottom: 24px; }
input { display: block; width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ccc; border-radius: 4px; }
button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }

/* Primary button (used by login, checkout, restart, view-cart) */
.btn-primary { background: #2563eb; color: white; }
.btn-primary:hover { background: #1d4ed8; }

/* Add to cart — normal */
.add-to-cart { background: #16a34a; color: white; }
.add-to-cart:hover { background: #15803d; }

/* Add to cart — INTENTIONAL TYPO CLASS (Smartphone only) */
.add-to-cart-typo { background: #9ca3af; color: white; }
.add-to-cart-typo:hover { background: #6b7280; }

/* Product card */
.product-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }

/* Cart items */
#cart-items { list-style: none; margin-bottom: 16px; }
#cart-items li { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }

/* Utility */
.hidden { display: none !important; }
.section { margin-top: 16px; }
#cart-count { background: #ef4444; color: white; border-radius: 50%; padding: 2px 7px; font-size: 13px; margin-left: 6px; }
```

---

### 3. `app.js`

Implement ALL of the following logic:

**Constants:**
```js
const VALID_USERS = [
  { username: 'test_user', password: 'password123' },
];
// Intentional bug: admin bypasses password check
```

**Login logic** (`login-btn` click):
- If `username === 'admin'` → allow login regardless of password ← intentional bug, keep it
- Else if credentials match `test_user / password123` → allow login
- Else → show `#login-error`
- On success: hide `#login-section`, show `#products-section`

**Cart state:**
```js
let cart = []; // array of { name, price }
```

**Add to cart:**
- Listen for clicks on `.add-to-cart` AND `.add-to-cart-typo` separately (both selectors must be handled)
- Push product to `cart[]`
- Update `#cart-count`

**View cart** (`view-cart-btn`):
- Render `#cart-items` list
- Compute and display total in `#cart-total`
- Show `#cart-section`, hide `#products-section`

**Back** (`back-btn`): show products, hide cart

**Checkout** (`checkout-btn`): show `#success-section`, hide `#cart-section`

**Restart** (`restart-btn`): reset `cart = []`, show `#login-section`, hide `#success-section`, clear username/password inputs

**Section visibility helper:**
```js
function showSection(id) {
  ['login-section','products-section','cart-section','success-section']
    .forEach(s => document.getElementById(s).classList.toggle('hidden', s !== id));
}
```

---

### 4. `package.json`

```json
{
  "name": "ecommerce-demo",
  "version": "1.0.0",
  "description": "Demo e-commerce app for Playwright testing",
  "scripts": {
    "test": "playwright test",
    "test:ci": "playwright test --reporter=junit"
  },
  "devDependencies": {
    "@playwright/test": "^1.44.0"
  }
}
```

---

### 5. `.gitignore`

```
node_modules/
.vscode/
test-results/
playwright-report/
```

---

## Output Format

Deliver all 5 files in sequence, each in its own labeled fenced code block. Do not skip any file, do not add summary text between files, and do not truncate any file's content.

**Order:**
1. `index.html`
2. `styles.css`
3. `app.js`
4. `package.json`
5. `.gitignore`

After the last file, write one short paragraph confirming what was generated and how to run `npm install && npx playwright install`.

---

## Intentional Bugs & Inconsistencies (Do NOT Fix These)

| Item | Description |
|---|---|
| `admin` login bypass | `username === 'admin'` skips password validation entirely |
| `add-to-cart-typo` class | Smartphone button uses a different CSS class than Laptop — simulates a UI inconsistency for Playwright selector tests |

These are **features** of the demo, not mistakes. A downstream Playwright test suite will intentionally target them.