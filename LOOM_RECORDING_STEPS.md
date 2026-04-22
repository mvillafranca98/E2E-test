# Loom Recording — Literal Step-by-Step

> Open this on a second monitor or phone while recording. Every section has the exact action, exact words, and exact transition. Total runtime target: **~9 minutes 30 seconds**.
>
> The quoted lines are what to say. Paraphrase freely — don't read word-for-word, just hit the beats.

---

## Before you hit record (5-minute setup)

Open everything in this exact order so you never fumble:

**Terminal (window 1)** — at `~/Desktop/Test/E2E-test/`
- Clear the screen (`clear`)
- Pre-warm once: run `pnpm test`, let it finish (~90s), clear the screen again

**Terminal (window 2)** — minimized, running `pnpm dev` in the app repo
- You'll only need this if the webServer auto-start is slow

**VS Code** — with `E2E-test` open, these files pinned as tabs in this order:
1. `README.md`
2. `playwright.config.ts`
3. `helpers/cookie-banner.ts`
4. `helpers/auth.ts`
5. `helpers/cart.ts`
6. `tests/auth.spec.ts` — scrolled to the `test.fail` block (around line 103)
7. `tests/cart.spec.ts` — scrolled to the `test.fail` block (around line 165)
8. `tests/checkout.spec.ts` — scrolled to the `test.fail` block (around line 114)

**Chrome** — two tabs in this order:
1. `https://github.com/mvillafranca98/E2E-test`
2. `http://localhost:5173` (dev server running)

**Everything else** — close Slack, email, notifications. Phone on Do Not Disturb. Water within reach. One test take recorded and discarded so your voice is warm.

**Loom settings** — screen + webcam bubble bottom-right, mic on, camera on.

---

## Section 1 — Intro (~45 seconds)

**Show on screen:** The GitHub repo page (Chrome tab 1).

**Do:** Nothing. Just be on the GitHub page.

**Say:**
> "Hey, I'm Armando. This is my walkthrough of the Playwright E2E suite I built for the Northwind Goods storefront as part of the Secure Privacy QA Engineer tech test.
>
> Quick summary before I dive in: **59 tests** across **six spec files**, zero hardcoded timeouts, runs three times in a row with no flakes, and it surfaces **three real bugs** I found in the app as `test.fail()` markers — so the suite documents them and goes red the day any of them is fixed.
>
> Let me show you around."

**Transition:** Alt-tab to VS Code.

---

## Section 2 — File structure tour (~90 seconds)

**Show on screen:** VS Code, file tree expanded on the left.

**Do (1):** Click `README.md` briefly — just to show it exists.

**Say:**
> "The layout is plain Playwright — `tests/` has the spec files, one per feature area, and `helpers/` has three reusable modules. README walks someone through setup and coverage."

**Do (2):** Click `playwright.config.ts`. Scroll to line with `retries: 0`.

**Say:**
> "Config is boring on purpose. Retries set to zero — deliberate, because retries hide flakiness. The `webServer` block auto-starts the app and reuses it if it's already running, so I don't fight with ports."

**Do (3):** Click `helpers/cookie-banner.ts`. Highlight the `frameLocator` line (~line 20).

**Say:**
> "The cookie banner is the **Secure Privacy iframe** — that's your own product, so I wanted to handle it carefully. This helper uses `frameLocator` to reach into the iframe and click `#sp-accept`. I originally tried seeding `sp_consent` into localStorage to skip the click, but the SDK rejected the minimal blob intermittently, so I fell back to the UI dismissal — reliability beat speed."

**Do (4):** Click `helpers/auth.ts`. Scroll to `loginViaStorage`.

**Say:**
> "Two flavors of login. `loginViaUI` for the auth spec itself, `loginViaStorage` for everywhere else. The detail I got wrong initially — the app stores auth in `ec_auth_v1` in localStorage **and** a session token in `ec_session_token` in sessionStorage. Seeding only one logs you out on the next navigation. The helper seeds both."

**Do (5):** Click `helpers/cart.ts`.

**Say:**
> "Tiny helper — `seedCart` uses `addInitScript` to write `ec_cart_v1` before any app code runs. That lets cart-heavy tests start from any state without clicking through the site."

**Transition:** "Now let me show you the three bugs the suite flagged."

---

## Section 3 — The three bugs (~2 minutes — the most important section)

This section is your differentiator. Take it slow. Don't rush.

---

### Bug #1 — Session token leak on logout

**Show on screen:** `tests/auth.spec.ts` — scrolled to the `test.fail` block around line 103.

**Do:** Highlight the test block with your cursor. Let the viewer read the comment.

**Say:**
> "First one is in the auth spec. **Logout clears `ec_auth_v1` in localStorage correctly — but the session token in sessionStorage survives.** That's a security-flavored bug. A logged-out session still has a valid token sitting in browser storage.
>
> Here's the test — it asserts the **correct** behavior, that the token should be null. Marked `test.fail`, which means Playwright expects this to fail today. The moment someone fixes the bug, the test will start passing and the suite will go red — that's my regression protection."

**Transition:** Switch tab to `tests/cart.spec.ts`.

---

### Bug #2 — Stale "Invalid promo code" error

**Show on screen:** `tests/cart.spec.ts` — scrolled to the `test.fail` block around line 165.

**Do:** Highlight the test block.

**Say:**
> "Second one is smaller but real. In the cart, if you enter an invalid promo code, you get an **'Invalid promo code'** error. Good. But that error then stays visible even after you remove items, change quantities, change the cart in any way. I'd expect that message to clear on the next cart mutation.
>
> Same pattern — the test asserts the correct behavior and is marked `test.fail`."

**Transition:** Switch tab to `tests/checkout.spec.ts`.

---

### Bug #3 — OOS checkout bypass (the meatiest one)

**Show on screen:** `tests/checkout.spec.ts` — scrolled to the `test.fail` block around line 114.

**Do:** Highlight the test block. Pause half a beat before saying this one — it's the most important.

**Say:**
> "Third one is the one I'm most proud of. If you seed an **out-of-stock product** directly into `ec_cart_v1` in localStorage — which simulates tab-to-tab cart drift, or a post-listing stock change — the app lets you complete the **entire checkout**. You can fill the shipping form, the payment form, click Place Order, and land on a real order confirmation page with an order number.
>
> There's no stock revalidation at the cart page, at checkout, or at place-order. The test seeds an OOS Selvedge Denim Jeans into the cart, completes checkout, and asserts the URL should NOT be a confirmation URL. Today it is. Marked `test.fail`."

**[OPTIONAL — if you have time, this is a killer demo]**

> "Let me actually show you this one live."

**Do:**
1. Switch to Chrome tab 2 (`http://localhost:5173`).
2. Open DevTools (Cmd+Option+I).
3. Go to Console tab.
4. Paste: `localStorage.setItem('ec_cart_v1', JSON.stringify({items:[{productId:'p003',quantity:1,size:'30'}],promoApplied:null}))`
5. Press Enter.
6. Close DevTools.
7. Navigate to `/cart` — viewer sees Selvedge Denim Jeans in cart.
8. Say: "Out-of-stock product, already in my cart."
9. Click "Proceed to checkout."
10. Log in if prompted (`test@example.com` / `Password123!`).
11. Fill shipping quickly: name "Ada", address "221B", city "London", zip "NW16XE", country "UK".
12. Fill payment: cardholder "Ada", card "4242 4242 4242 4242", expiry "12/30", CVC "123".
13. Click "Place order."
14. Confirmation page loads.
15. Say: "**That's a real order for an out-of-stock product.** This is exactly what the `test.fail` marker is asserting should not happen."

**[END OPTIONAL]**

**Transition:** Back to VS Code, then to terminal.

---

## Section 4 — Run the suite live (~90 seconds)

**Show on screen:** Terminal window 1 (at `~/Desktop/Test/E2E-test/`).

**Do:** Type `pnpm test` and press Enter. The suite takes ~90 seconds, which you'll fill with talking.

**Say (immediately after pressing Enter):**
> "Here's the whole suite running headless."

**Say (while it runs, fill the ~90 seconds):**
> "While this runs — a few details worth mentioning.
>
> Every test gets a fresh browser context by default, so localStorage and sessionStorage are isolated between tests. No test depends on another test's state. That's why I can seed the cart in one test and not worry about leaking into the next.
>
> I also scope every locator on the cart page to `main` instead of the whole document, because the **cart drawer is always mounted** in the layout — so every `cart-line-*` test ID appears twice on `/cart`. Without scoping, Playwright throws a strict-mode error. That's the kind of detail you only catch by actually using the site before writing tests.
>
> And for reliability — I run the suite three times in a row with `--repeat-each=3` before every commit. Last green run was 174 test runs, zero flakes. Two flakes I did hit earlier were on checkout validation — I fixed them by switching `toHaveText` to `toContainText` to absorb trailing whitespace under parallel load."

**When the run finishes, point at the output:**

**Say:**
> "**58 green, one ✘** — that's the session-token bug from the auth spec, expected to fail. Total runtime about 90 seconds."

**Transition:** Back to VS Code or stay on terminal.

---

## Section 5 — AI usage: what worked, what I fixed, what I'd do differently (~110 seconds)

**Show on screen:** VS Code or GitHub commits page — whichever you prefer.

**Say:**
> "AI usage is explicit in the evaluation criteria, so I want to be upfront about it. I used **Claude Code** to accelerate the scaffolding and first drafts. Every spec was then reviewed against the real app.
>
> **What worked well**: the AI was great at structural scaffolding — the Playwright config, the helpers folder, the spec skeletons. That was 30 minutes of boilerplate done in a couple of minutes.
>
> **What I had to fix**: three concrete examples.
>
> One — **selectors**. The AI assumed locators like `getByRole('button', { name: \"Men's Apparel\" })`, but that matched the Women's chip too because of the substring overlap. I swapped them for the real test IDs like `category-chip-apparel-mens` across the browsing spec.
>
> Two — **assertions that didn't match reality**. The initial plan said 'reduce quantity to zero removes the item.' In reality, the decrement button is disabled at qty=1 and users have to click Remove. I rewrote that test.
>
> Three — **plural vs. singular errors**. AI-drafted tests expected multiple error messages on an empty checkout submit. The actual app surfaces **one** `checkout-error` node with the first missing field at a time. Different test.
>
> And one retraction I'll call out because you shouldn't hide these: I originally reported that 'add-to-cart without size is a silent no-op' as a bug. On deeper inspection, the app **does** show 'Please select a size' — it just renders below the footer and I missed it in my first sweep. I retracted it in my planning doc and converted it to a normal passing test.
>
> **What I'd do differently**: I'd invest more in a thorough manual end-to-end sweep before any AI generation. I did a sweep, but I rushed from there to the first spec, and a lot of the mid-stream corrections came from details I could have captured up front. I'd also wire the `test.fail` count into CI output so the known bugs don't quietly become normal.
>
> The broader principle: AI got me 80% of the way fast, but the remaining 20% was me running each test headed against the real app and rewriting whatever the AI assumed but couldn't verify. Unreviewed AI output would have produced a fragile suite."

**Transition:** Stay on VS Code or switch back to GitHub.

---

## Section 6 — Edge cases found (~60 seconds)

**Show on screen:** Either `tests/browsing.spec.ts` or `tests/product-detail.spec.ts` — pick one and briefly scroll.

**Say:**
> "The three `test.fail` markers are the headline edge cases, but a few more worth calling out:
>
> - **Protected-route redirects preserve the intended destination.** Hitting `/account` logged out redirects to `/login?redirect=%2Faccount`, and after login you end up back at `/account`. Tested.
>
> - **Rapid clicks on Add-to-cart have no debounce** — three clicks, three items. That might be intentional, but I locked it in a test so a future debounce implementation surfaces as a regression to be discussed.
>
> - **Cart state persists across page reload** via localStorage — verified explicitly.
>
> - **Two products literally named 'Classic White Tee'** — men's and women's. Name-only selectors are ambiguous, so I always disambiguate by slug.
>
> I also wrote a manual-sweep report before writing a single test — that's in the `Plan.md` inside the app repo, with the exact error strings and test ID cheat sheet I built the specs from."

**Transition:** Verbally move into trade-offs.

---

## Section 7 — Trade-offs and decisions (~45 seconds)

**Show on screen:** Stay where you are.

**Say:**
> "A few decisions worth flagging — the kind of thing a teammate picking this up should know.
>
> **One** — I only target Chromium. The app is a client-side React SPA with no browser-specific behavior I found, and single-browser keeps CI fast. Adding WebKit and Firefox is a one-line config change when it's worth the time. For a CMP product running on hundreds of customer configurations, I'd absolutely flip this.
>
> **Two** — most auth is seeded directly into storage rather than driven through the UI. The UI login path is exercised in the auth spec, but every other spec uses `loginViaStorage` to stay fast and isolated. Speed-vs-realism trade-off, made deliberately.
>
> **Three** — I chose UI dismissal over localStorage seeding for the cookie banner. Tried seeding, got inconsistent results from the SDK, so I eat a 500ms iframe dismissal per test. Reliability won over speed.
>
> **Four** — no visual-regression or accessibility coverage. Out of scope for the 1-to-2-hour target, but `toHaveScreenshot` and axe-core are natural next steps."

**Transition:** Back to GitHub repo tab for the close.

---

## Section 8 — Close (~30 seconds)

**Show on screen:** Chrome tab 1 (GitHub repo).

**Say:**
> "That's the whole suite. Code is on GitHub, commits are broken out per spec so you can see the progression. The `test.fail` markers turn green the day each bug is fixed — self-updating bug tracking.
>
> Happy to dig into any of this further. Thanks for watching."

**Do:** Stop recording. Watch it back at 1.5x.

---

## Troubleshooting on camera

| Problem | Fix |
|---------|-----|
| You lose your place | Take a breath. Say "Let me pick that back up — " and continue. Trim later. |
| Dev server is slow / refuses | `cd ../example-e-commerce-website && pnpm dev` in terminal 2, wait 3s, retry. |
| `pnpm test` is slow | That's normal — ~90s. Use the time to talk. |
| Live OOS demo breaks | Skip it. The test.fail marker in the spec file is enough proof. |
| You say something wrong | Keep going. Loom's trim tool handles it. |

---

## Timing budget

| Section | Target | Running total |
|---------|-------:|--------------:|
| 1. Intro | 0:45 | 0:45 |
| 2. File structure | 1:30 | 2:15 |
| 3. Three bugs (no live demo) | 2:00 | 4:15 |
| 3. Three bugs (with live demo) | 3:00 | 5:15 |
| 4. Live suite run | 1:30 | 5:45 / 6:45 |
| 5. AI usage | 1:50 | 7:35 / 8:35 |
| 6. Edge cases | 1:00 | 8:35 / 9:35 |
| 7. Trade-offs | 0:45 | 9:20 / 10:20 |
| 8. Close | 0:30 | 9:50 / 10:50 |

**If you do the live demo in section 3, cut 20–30s from section 5 (AI usage) to stay under 10 minutes.** The AI section can tighten to the three examples + "what I'd do differently" + closing line.

---

## After you stop recording

1. Watch back at 1.5× speed. Note any section that's genuinely painful.
2. Trim dead air longer than 2 seconds.
3. Add chapter markers at each section heading (Loom timeline → click + button).
4. **Title:** "Northwind Goods E2E Suite — Armando Villafranca"
5. **Description:** paste the repo URL, "59 tests, 3 known-bug markers, 174/174 across 3 flake runs."
6. Before sending: share the link with yourself, open it on your phone, confirm audio and video both work.
7. Send.
