// tests/saucedemo.checkout.spec.js
const { test, expect } = require('@playwright/test');

// Helper to extract numbers from strings like "$29.99" or "Item total: $62.97"
function parseMoney(str) {
  return parseFloat(str.replace(/[^\d.]/g, ''));
}

test('User can buy 3 random items successfully', async ({ page }) => {
  // 1) Go to login page
  await page.goto('https://www.saucedemo.com/');

  // 2) Login with the standard test credentials
  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();

  // Expect to land on the inventory page
  await expect(page).toHaveURL(/.*inventory\.html/);

  // 3) On the Products page, grab all product cards
  const cards = page.locator('.inventory_item');
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(3); // sanity check

  // 4) Pick 3 unique random indices (Fisher–Yates shuffle)
  const indices = Array.from({ length: count }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const pick = indices.slice(0, 3);

  // 5) Collect chosen items' names & prices, then click "Add to cart"
  const selected = [];
  for (const i of pick) {
    const item = cards.nth(i);
    const name = (await item.locator('.inventory_item_name').innerText()).trim();
    const priceText = (await item.locator('.inventory_item_price').innerText()).trim();
    const price = parseMoney(priceText);
    await item.getByRole('button', { name: 'Add to cart' }).click();
    selected.push({ name, price });
  }

  // Log what we picked (shows up in the test output)
  console.log('Selected items:', selected);

  // 6) Cart badge should read "3"
  await expect(page.locator('.shopping_cart_badge')).toHaveText('3');

  // 7) Go to the cart page
  await page.locator('.shopping_cart_link').click();
  await expect(page).toHaveURL(/.*cart\.html/);

  // 8) Verify there are exactly 3 items and details match
  const cartItems = page.locator('.cart_item');
  await expect(cartItems).toHaveCount(3);

  const cartDetails = [];
  for (let i = 0; i < 3; i++) {
    const row = cartItems.nth(i);
    const name = (await row.locator('.inventory_item_name').innerText()).trim();
    const price = parseMoney(await row.locator('.inventory_item_price').innerText());
    cartDetails.push({ name, price });
  }

  // Compare names (sorted to avoid order issues)
  const selectedNames = selected.map(x => x.name).sort();
  const cartNames = cartDetails.map(x => x.name).sort();
  expect(cartNames).toEqual(selectedNames);

  // Compare prices (sorted)
  const selectedPrices = selected.map(x => x.price).sort((a, b) => a - b);
  const cartPrices = cartDetails.map(x => x.price).sort((a, b) => a - b);
  expect(cartPrices).toEqual(selectedPrices);

  // 9) Start checkout
  await page.locator('[data-test="checkout"]').click();
  await expect(page).toHaveURL(/.*checkout-step-one\.html/);

  // 10) Enter user info and continue
  await page.locator('[data-test="firstName"]').fill('Ali');
  await page.locator('[data-test="lastName"]').fill('Habeeb');
  await page.locator('[data-test="postalCode"]').fill('12345');
  await page.locator('[data-test="continue"]').click();

  // 11) Overview page: verify items and price math
  await expect(page).toHaveURL(/.*checkout-step-two\.html/);

  const overviewItems = page.locator('.cart_item');
  await expect(overviewItems).toHaveCount(3);

  const itemTotalText = await page.locator('.summary_subtotal_label').innerText(); // "Item total: $XX.XX"
  const taxText = await page.locator('.summary_tax_label').innerText();             // "Tax: $X.XX"
  const totalText = await page.locator('.summary_total_label').innerText();         // "Total: $YY.YY"

  const expectedItemSum = selected.reduce((sum, it) => sum + it.price, 0);
  const displayedItemTotal = parseMoney(itemTotalText);
  const displayedTax = parseMoney(taxText);
  const displayedTotal = parseMoney(totalText);

  // Round to 2 decimals to avoid floating point issues
  const round2 = n => Math.round(n * 100) / 100;
  expect(round2(displayedItemTotal)).toBe(round2(expectedItemSum));
  expect(round2(displayedItemTotal + displayedTax)).toBe(round2(displayedTotal));

  // 12) Finish checkout and verify success
  await page.locator('[data-test="finish"]').click();
  await expect(page).toHaveURL(/.*checkout-complete\.html/);
  await expect(page.getByText('Thank you for your order!')).toBeVisible();
});
