# Northwind Goods — E2E Test Suite

Playwright end-to-end tests for the [Northwind Goods](https://github.com/secureprivacy/example-e-commerce-website) storefront, built for the Secure Privacy QA Engineer tech test.

## Prerequisites

- Node 20+
- pnpm 10 (enabled via `corepack enable`)
- The app checked out at `../example-e-commerce-website` relative to this repo

## Install

```sh
pnpm install
pnpm exec playwright install chromium
```

## Run

```sh
pnpm test              # headless, full suite
pnpm test:headed       # watch it run in a visible browser
pnpm test:ui           # Playwright UI mode
pnpm test:flake        # run the suite 3x to catch flakes
pnpm report            # open the last HTML report
```

The config points Playwright's `webServer` at `../example-e-commerce-website` and reuses an already-running dev server if present, so you don't need to start the app manually.

## Layout

```
E2E-test/
├── tests/
│   ├── cookie-consent.spec.ts    # Secure Privacy banner: accept, decline, persistence
│   ├── auth.spec.ts              # login, register, logout, protected routes
│   ├── browsing.spec.ts          # product list, category filters, sort, search
│   ├── product-detail.spec.ts    # PDP, in/out of stock, size selection, missing-size error
│   ├── cart.spec.ts              # add, qty, remove, promo, shipping thresholds
│   └── checkout.spec.ts          # field validation + happy path + confirmation
├── helpers/
│   ├── cookie-banner.ts          # dismissCookieBanner (iframe-aware)
│   ├── auth.ts                   # loginViaUI + loginViaStorage (seeds localStorage + sessionStorage)
│   └── cart.ts                   # seedCart + clearAppState
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## Coverage summary

| Spec | Tests | Focus |
|------|------:|-------|
| `cookie-consent` | 5 | Secure Privacy iframe banner: Accept/Decline buttons, `sp_consent` payload, persistence across reload for both actions. |
| `auth` | 13 | Login (valid/invalid/empty), register (valid/duplicate/short-pw/no-uppercase), logout, protected-route redirects with preserved destination, plus one `test.fail()` for the sessionStorage token leak on logout. |
| `browsing` | 11 | Homepage featured products, 16-product listing, Men's/Accessories/All filters, 3 sort orders, search (incl. 0-result empty-state and search-clear), unknown-route 404 page. |
| `product-detail` | 7 | In-stock PDP, OOS PDP with disabled button, size selection via `data-selected`, add-with-size persists correct `ec_cart_v1` line, 404 slug, "Please select a size" error when no size chosen, rapid-click accumulation (no debounce) on sizeless product. |
| `cart` | 15 | Empty state, same-size-merges / different-size-splits, qty increment, decrement disabled at qty=1, remove line, cart-persists-across-reload, `WELCOME10` (10% off), invalid code, promo-remove strips discount, reuse-block, shipping thresholds at $50; one `test.fail()` for the stale-error persistence bug. |
| `checkout` | 8 | Happy path (login + cart + shipping + card + order confirmation), first-field-only validation, ZIP < 3 chars, Luhn fail, expired card, short CVC, confirmation page; one `test.fail()` for the OOS-cart-completes-checkout bug. |

**Total: 59 tests (56 positive + 3 known-bug markers).** The `test.fail()` markers flag real bugs discovered during the manual sweep — the suite goes red the day any of them is fixed.

## Known bugs flagged by the suite

1. **Logout leaves `ec_session_token` in sessionStorage.** — `auth.spec.ts`
2. **Stale "Invalid promo code" error persists through unrelated cart actions.** — `cart.spec.ts`
3. **OOS items seeded in `ec_cart_v1` complete checkout with a real confirmation.** — `checkout.spec.ts`

## Selector strategy

Playwright `getByTestId()` wherever the app exposes `data-testid` (every interactive element does). Role/text selectors only where a test id doesn't exist (category chips are an exception — `category-chip-*`). All locators on `/cart` are scoped to `<main>` because the cart drawer duplicates every `cart-line-*` test id.

## Reliability notes

- **Cookie banner is a third-party iframe.** Helper uses `page.frameLocator('#ifrmCookieBanner')` and dismisses via `#sp-accept` with a 4s budget — no-op if the banner isn't visible. Not seeded via localStorage because the Secure Privacy SDK rejects a minimal blob inconsistently and the UI-dismiss path is 100% reliable.
- **Every test uses a fresh browser context** (Playwright default), so storage is isolated and there is no cross-test state leakage.
- **No fixed `waitForTimeout` calls.** All waits are on element state or text presence, with Playwright's auto-waiting.
- **Suite runs 3× with no flakes** (`pnpm test:flake`) — 174/174 on the most recent run.

## Trade-offs

- Only Chromium is targeted — the app is a client-side SPA with no browser-specific behavior I uncovered, and keeping the matrix small keeps CI fast. Adding WebKit/Firefox is a one-line config change.
- Auth state is mostly seeded (`loginViaStorage`) rather than driven through the UI. The UI login path is exercised in `auth.spec.ts`; other specs skip it to stay fast and isolated.
- No visual-regression or a11y coverage. Both were out of scope for the 1–2 hour target.

## AI usage

Scaffolding, first drafts of each spec, and the initial site sweep were done with Claude Code. Each generated spec was then run headed, debugged against the real app, and rewritten when the app didn't behave like the AI assumed. Corrections worth calling out:

- AI proposed selectors that didn't exist; real test IDs were discovered by inspecting the live DOM and then wired into the specs.
- AI-generated tests asserted plural validation errors on login / checkout; the real app surfaces a single form-level error — rewrote both specs.
- AI parroted the plan's "decrement to 0 removes item" behavior; the real button disables at qty=1. Test was corrected.
- I initially reported "add-to-cart without size is silent" as a bug; on deeper inspection the app renders "Please select a size" below the footer. Retracted in `Plan.md` and converted to a passing test.
