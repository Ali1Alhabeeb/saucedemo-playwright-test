# SauceDemo E2E Checkout Test (Playwright • JavaScript)

This repository contains an end‑to‑end (E2E) automated test for the **SauceDemo** site:
- Logs in with the standard demo account
- Adds **3 random products** to the cart
- Verifies item names, prices, and cart count
- Completes checkout and asserts the **success message**
- Produces an **HTML report**, **JUnit XML**, and (on failure) **screenshots/videos**; **trace** on retry

> Stack: **Playwright (@playwright/test)** with **JavaScript** (no TypeScript required).

---

## 1) Acceptance Criteria (what this test verifies)
- User can log in with valid demo creds (`standard_user` / `secret_sauce`)
- Exactly **3 distinct items** are added to the cart
- Cart page shows the **same item names & prices** that were added
- Checkout Overview shows **3 items**, and:
  - **Item total** equals the **sum** of the three prices
  - **Total = Item total + Tax**
- Finishing checkout shows **“Thank you for your order!”**

---

## 2) Prerequisites
- **Node.js 18+**
- `npm` on PATH
- Browsers installed for Playwright (first run below installs them automatically)

---

## 3) Install
```bash
npm ci || npm install
npx playwright install
```

---

## 4) Run locally

Run all tests (headless):
```bash
npx playwright test
```

Run **just this suite** (headed so you can watch it):
```bash
npx playwright test -g "User can buy 3 random items successfully" --headed
```

Open the HTML **report** (after a run):
```bash
npx playwright show-report
```

### Helpful options
List test titles to confirm grep filters:
```bash
npx playwright test --list
```
Run a specific file:
```bash
npx playwright test tests/saucedemo.checkout.spec.js --headed
```

---

## 5) Reports & Artifacts

This project is configured to generate:
- **HTML report** → `playwright-report/` (open with `npx playwright show-report`)
- **JUnit XML** → `test-results/junit.xml` (CI-friendly)
- **On failure** → screenshots/videos under `test-results/`
- **Trace on retry** → `test-results/**/trace.zip` (open with `npx playwright show-trace <zip>`)

Playwright settings live in **`playwright.config.js`**:
```js
reporter: [
  ['list'],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['html', { open: 'never' }],
],
use: {
  baseURL: 'https://www.saucedemo.com',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
},
retries: 1,
```

---

## 6) Randomness & Reproducibility (optional)
If you enabled the **seeded selection** block in your test, you can reproduce the **same 3 items** each run by setting `SEED`:
```bash
SEED=ali npx playwright test -g "random items"
```
> If you did not add the seeding helper, you can ignore this section—your test will still run with true randomness.

---

## 7) Project structure
```
.
├─ tests/
│  └─ saucedemo.checkout.spec.js      # main E2E test (JS)
├─ playwright.config.js               # JS config (reports, retries, artifacts)
├─ package.json
└─ README.md
```

---

## 8) CI (GitHub Actions)

A minimal, recruiter‑friendly workflow runs on push/PR, installs browsers, executes tests, and uploads artifacts:

```yaml
name: Playwright Tests
on:
  push: { branches: [ main, master ] }
  pull_request: { branches: [ main, master ] }
jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    env:
      SEED: "ci"  # optional: makes 3‑item selection reproducible
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install deps
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run tests
        run: npx playwright test
      - name: Upload HTML report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-html-report
          path: playwright-report
          retention-days: 14
      - name: Upload test-results (screens/videos/traces)
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results
          retention-days: 14
      - name: Upload JUnit XML
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: junit-xml
          path: test-results/junit.xml
          retention-days: 14
```

> Your existing workflow is fine; this section documents how to find reports under the **Actions → Artifacts** of a run.

---

## 9) Troubleshooting

**EPERM: operation not permitted, scandir '/Users/<you>/.Trash'**  
Run tests from the **project directory** or target the file directly:
```bash
cd /path/to/your/project
npx playwright test tests/saucedemo.checkout.spec.js --headed
```

**No tests found**  
List names and adjust your `-g` filter:
```bash
npx playwright test --list
```

**Slow network / timeouts**  
Optionally raise timeout in `playwright.config.js`:
```js
// timeout: 60000,
```

**See what happened on failure**  
Open the **HTML report**, **screens/videos** in `test-results/`, or the **trace**:
```bash
npx playwright show-report
npx playwright show-trace test-results/**/trace.zip
```

---

## 10) Notes for Reviewers (quick start)

- **Install:** `npm ci && npx playwright install`
- **Run:** `npx playwright test -g "User can buy 3 random items successfully"`
- **Report:** `npx playwright show-report`
- **Artifacts in CI:** Actions → open the latest run → **Artifacts** sidebar

---

### License
MIT (or choose your preferred license)
