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

The config points Playwright's `webServer` at `../example-e-commerce-website` and reuses an already-running dev server if present.

## Layout

```
E2E-test/
├── tests/
│   └── cookie-consent.spec.ts    # Secure Privacy banner: accept, decline, persistence
├── helpers/
│   ├── cookie-banner.ts          # dismissCookieBanner (iframe-aware)
│   ├── auth.ts                   # loginViaUI + loginViaStorage (seeds localStorage + sessionStorage)
│   └── cart.ts                   # seedCart + clearAppState
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## Coverage summary

_Filled in once the full suite is complete._
