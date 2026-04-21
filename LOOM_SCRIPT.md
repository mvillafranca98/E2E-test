# Loom script — Northwind Goods E2E suite

A tight 8-minute script mapped to the sections the tech-test PDF asks for. Use the headings as chapter markers; the _Do:_ lines are what to put on screen; the quoted lines are what to actually say. Keep it natural — these are beats, not a teleprompter.

## Before you hit record

Open these, arranged on one desktop:
- Editor (VS Code / your choice) with the `E2E-test` repo open
- Terminal in `~/Desktop/Test/E2E-test/`
- Browser tab 1: `http://localhost:5173/` (make sure `pnpm dev` is running in the app repo)
- Browser tab 2: `https://github.com/mvillafranca98/E2E-test` (the repo)

Kill any open Playwright HTML reports so `pnpm report` opens fresh.

Pre-warm the suite once (`pnpm test`) so on-camera runs are as fast as possible.

Final check: camera on, mic test, Loom set to record screen + webcam bubble bottom-right.

---

## 1. Intro (≈ 45s)

_Do:_ open on the GitHub repo page.

> "Hey, I'm Armando. This is my walkthrough of the Playwright E2E suite I built for the Northwind Goods storefront as part of the Secure Privacy QA Engineer tech test.
>
> Quick summary before I dive in: 59 tests across six spec files, zero hardcoded timeouts, runs three times in a row with no flakes, and it surfaces three real bugs I found in the app as `test.fail()` markers — so the suite documents them and goes red the day any of them is fixed.
>
> Let me show you around."

---

## 2. File structure (≈ 90s)

_Do:_ switch to the editor with the repo tree visible.

> "The layout is plain Playwright — `tests/` holds the spec files, one per feature area, and `helpers/` has three reusable modules."

_Do:_ click into `helpers/cookie-banner.ts`.

> "The cookie banner is the Secure Privacy iframe — their own product, so I wanted to handle it carefully. This helper uses `frameLocator` to reach into the iframe, waits up to four seconds for the Accept button, and is a safe no-op if the banner isn't shown. I originally tried seeding `sp_consent` into localStorage to skip the UI click, but the SDK rejected the minimal blob intermittently — so I fell back to the UI-dismiss path which runs reliably every time."

_Do:_ open `helpers/auth.ts`.

> "Two flavors of login: `loginViaUI` for the auth spec itself, `loginViaStorage` for everywhere else. One detail I got wrong on the first pass — the app stores the auth state in localStorage under `ec_auth_v1` AND a session token in sessionStorage under `ec_session_token`. Seeding only one logs you out on the next navigation. The helper seeds both."

_Do:_ open `helpers/cart.ts`.

> "Tiny helper — `seedCart` writes directly into `ec_cart_v1` via `addInitScript` so cart-heavy tests can start from any state without clicking through the whole site."

_Do:_ show `playwright.config.ts`.

> "Config is boring on purpose: retries 0 because reliability should be by construction, not hidden by retries. `webServer` auto-starts the app and `reuseExistingServer: true` so I don't fight with ports during development."

---

## 3. Interesting tests (≈ 75s)

_Do:_ open `tests/auth.spec.ts`, scroll to the logout describe.

> "Here's one of three `test.fail()` markers. Logout clears `ec_auth_v1` correctly, but the session token in sessionStorage survives. That's a security-flavored bug — a logged-out session still has a valid token sitting in browser storage. The test asserts the correct behavior — token should be null — and is marked `test.fail()` so Playwright expects it to fail today and will flag a regression the moment it's fixed."

_Do:_ open `tests/checkout.spec.ts`, scroll to the OOS bug.

> "This one I'm most proud of. If you seed an out-of-stock item directly into `ec_cart_v1` — simulating tab-to-tab cart drift or a post-listing stock change — the app lets you complete the entire checkout. It shows a real order confirmation with an order number. No stock revalidation at the cart page, at checkout, or at place-order. Again marked `test.fail()`."

_Do:_ open `tests/cart.spec.ts`, point at the stale-error marker.

> "Third one is smaller but real — the Invalid promo code error stays visible after you remove a line or change a quantity. I'd expect that message to clear on the next cart mutation."

---

## 4. Run the suite live (≈ 90s)

_Do:_ switch to terminal, run `pnpm test`.

> "Here's the whole suite running headless."

_While it runs (~90s):_

> "One thing worth mentioning — every test gets a fresh browser context by default, so localStorage and sessionStorage are isolated. No test depends on another test's state. That's why I can seed the cart in one test and not worry about leaking into the next one.
>
> I also scope every locator on the cart page to `main` instead of the whole document, because the cart drawer is always mounted in the layout — so every `cart-line-*` test ID appears twice on `/cart`. That's the kind of detail you only catch by actually using the site."

_When it finishes:_

> "58 green, 1 marked-failing — the session-token bug we just looked at. Around 90 seconds for the whole run. And for reliability" — _run_ `pnpm test:flake` _if time permits, or just show the last green CI result_ — "I run this three times in a row before every commit. 174 runs on the most recent pass, zero flakes."

---

## 5. AI usage (≈ 90s)

> "AI usage is explicit in the evaluation criteria so I want to be upfront about it. I used Claude Code to accelerate the scaffolding and first drafts, but every spec was reviewed against the real app. A few concrete examples of what I had to fix:
>
> First — selectors. The AI assumed selectors like `getByRole('button', { name: \"Men's Apparel\" })` but that matched the Women's chip too because of the substring overlap. Real test IDs existed: `category-chip-apparel-mens`, etc. I swapped them across the browsing spec.
>
> Second — assertions that didn't match real behavior. The plan said 'reduce quantity to zero removes the item.' In reality, the decrement button is disabled at qty=1 and users have to click Remove. I rewrote that test to assert the correct behavior — disabled button, then explicit Remove.
>
> Third — plural vs singular errors. AI-drafted tests expected multiple error messages on an empty checkout submit. The actual app surfaces one `checkout-error` node with the first missing field. Cleaner UX, different test.
>
> And one retraction I'll call out because it's the kind of thing you shouldn't hide: I originally reported the 'add-to-cart without size is a silent no-op' as a bug. On deeper inspection, the app does show 'Please select a size' — it just renders below the footer and I missed it. I retracted it in the plan doc and converted it to a normal passing test.
>
> The broader principle: the AI got me 80% of the way fast, but the remaining 20% was me running each test headed against the real app and rewriting whatever the AI assumed but couldn't verify. Unreviewed AI output would have produced a fragile suite."

---

## 6. Edge cases found (≈ 60s)

> "The three `test.fail()` markers are the headline edge cases, but a few more worth calling out:
>
> - Protected-route redirects preserve the intended destination. `/account` unauthenticated → `/login?redirect=%2Faccount`, then login takes you back to `/account`. Test for that.
> - Rapid clicks on Add-to-cart have no debounce — 3 clicks, 3 items. Current behavior, probably intentional, but I locked it in a test so a future debounce implementation would surface as a regression to be discussed.
> - Cart state persists across page reload via localStorage — verified explicitly.
> - Two products literally named 'Classic White Tee' (men's and women's) — name-only selectors are ambiguous, so I always disambiguate by slug.
>
> I also wrote a manual-sweep report before writing a single test — that's in the Plan.md inside the app repo, with the exact error strings and test ID cheat sheet I built the specs from."

---

## 7. Close (≈ 30s)

_Do:_ switch back to the GitHub repo tab.

> "That's the whole suite. Code is on GitHub, commits are broken out per spec so you can see the progression. Happy to dig into any of this further — thanks for watching."

---

## Quick fallback if something goes wrong on camera

| If… | Do this |
|-----|---------|
| Dev server isn't running | `cd ../example-e-commerce-website && pnpm dev &`, wait 2s, retry |
| `pnpm test` hangs on first run | Ctrl-C, `pnpm exec playwright install chromium`, rerun |
| HTML report won't open | `rm -rf playwright-report/ && pnpm test && pnpm report` |
| You fumble a line | don't stop — Loom edits are fast, cut it after. Keep the energy up. |

---

## Post-recording checklist

- [ ] Watch the video back once. Cut dead air > 2s.
- [ ] Verify audio sounds level across the whole thing.
- [ ] Add chapters at the section markers above (Loom lets you drop them in the timeline).
- [ ] Title: "Northwind Goods E2E Suite — Armando Villafranca"
- [ ] Description: paste the repo URL, test count, flake-run numbers.
- [ ] Share the link in the submission email alongside the repo URL.
