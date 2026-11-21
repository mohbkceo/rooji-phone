# UI/UX engineering review

Date: 21 November 2026. Baseline: `6bbed22` (`main`).

This is an implementation review and heuristic evaluation, not a user study or a WCAG conformance certification. No improvement percentages, task times, or frame-rate measurements are inferred.

## Audit and application map

The actual stack is Next.js 16.4.6 App Router, React 19.3.1, Tailwind 4, Lucide, server actions, and SQLite. There was no animation library. The installed Next documentation was consulted before changing navigation and GET forms.

| Area | Pages and hierarchy | Main weakness at baseline |
| --- | --- | --- |
| Browse | Home; catalogue / nouveautés / category → product | Detail return links led to an unfiltered parent; no centralized focus or transition behavior |
| Purchase | Product → cart → checkout | Cart confirmation did not offer an immediate destination link |
| Services | Repair steps; product request → private tracking | Step changes left focus behind; no device/problem review before submission |
| Customer | Sign-in, registration, account; tracking list → record | Inconsistent location cues and missing parent navigation |
| Administration | Dashboard → products, orders, repairs, requests, clients, statistics, settings; four list → detail flows | Detail links dropped list parameters; small row links; inconsistent filter presentation |
| Shared interface | Shop header/footer, admin sidebar, buttons, breadcrumbs, forms | Mobile disclosure stayed open after focus moved outside; secondary targets were smaller than primary buttons; unsaved forms had no exit protection |

Existing strengths were retained: red/white branding, real photographs, local Inter font, fluid headings, a four-pixel spacing unit, responsive grids, semantic labels, server validation, and primary controls with 44px minimum height. The work changes no authentication, permissions, database schema, pricing, inventory, API, or server-action contracts.

## Research rationale and decisions

Sources were read on the review date. An empirical model can inform a decision without proving that this implementation improves performance.

| Problem → implementation | Basis and evidence category | Evaluation |
| --- | --- | --- |
| Small secondary targets → taller breadcrumb/footer/table links and 44px image controls | Fitts's law, an empirical pointing model discussed in [MIT Lecture 4](https://ocw.mit.edu/courses/6-831-user-interface-design-and-implementation-spring-2011/821f3aa658f9ea1ebcd06dafe7a5251d_MIT6_831S11_lec04.pdf). [W3C target sizing](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) is accessibility guidance. 44px is a preferred design target; WCAG 2.2 AA's minimum criterion is 24px with exceptions. No fitted movement times are claimed. | CSS dimensions checked; narrow-layout browser checks |
| Hard-to-find categories and obscured filter state → category links, contextual filter disclosure, active summaries, result ranges and reset actions | MIT's discussion of Hick–Hyman concerns constrained choice tasks, not an arbitrary maximum button count. Grouping and disclosure here are design hypotheses. [Stanford's usability framework](https://improvement.stanford.edu/resources/usability-principles) supplies professional guidance on recognition and user control. | Search, stock and sorting exercised in-browser; existing SQL behavior retained |
| Missing location context → canonical breadcrumbs plus a separate contextual return control | [NN/g breadcrumb guidance](https://www.nngroup.com/articles/breadcrumbs/), professional guidance: hierarchy and history have different purposes. | Product, account/tracking and admin structures inspected; Back/Forward and refresh exercised for the catalogue/product flow |
| Disconnected navigation → shared page focus management and relationship-based motion | [Material navigation transitions](https://m1.material.io/patterns/navigational-transitions.html), professional guidance; [Chrome's implementation guide](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/directional-navigation-transitions), engineering guidance. Neither proves an ideal animation duration. | Relationship tests, browser navigation, reduced-motion/unsupported-animation branch tests |
| Unclear step progression → editable completed steps, a device/problem review and an explicit focusable step heading | Recognition, feedback and error prevention from Stanford and [NN/g's heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), professional heuristics. | Full browser repair submission to private tracking; no premature submission on Continue |
| Accidental exits → opt-in dirty-form confirmations, unload protection and busy states | Error prevention/user control, professional heuristics. Protection is scoped to substantial data entry, excluding sign-in forms and simple GET filters. | Canceled internal exit retained entered repair data; production action workflows passed |
| Dense tables and inconsistent grouping → readable table headers, keyboard-focusable scrolling regions, labelled filters and constrained explanatory text | [NN/g visual design](https://www.nngroup.com/articles/principles-visual-design/), professional guidance on hierarchy and Gestalt grouping. Typography, radii and spacing remain design choices. | Type/build checks and authenticated production HTTP workflows; no browser admin usability study |
| Sticky navigation and open menus could hide focus → scroll offsets, Escape/focus-out/outside-click dismissal and a viewport-bounded menu | [W3C focus-not-obscured guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum). | Menu Escape restored trigger focus; 200%/400% zoom and narrow reflow checked |

The spacing scale, `clamp()` heading bounds, 12px movement and 200ms route duration are tunable engineering/design parameters, not universal psychological constants. Larger target dimensions trade some density for easier activation. Visible category links trade some space for discoverability. No new runtime dependency was added.

## Files and implemented behavior

| Files | Responsibility |
| --- | --- |
| `lib/navigation.ts`, `components/navigation.tsx`, root layout | Explicit relationships, safe contextual Back, route focus and in-memory scroll/origin-link restoration |
| `lib/motion.ts`, global styles | Optional Web Animations motion, reduced-motion rules, consistent targets, grouping, viewport-safe menu and focus offsets |
| `components/mobile-menu.tsx`, `admin-nav.tsx`, `navigation-pending.tsx`, shop layout | Persistent shop navigation, active context, tracking destination, menu behavior and non-blocking pending feedback |
| `components/catalog-page.tsx`, `admin-ui.tsx`, admin client/statistics pages | Next GET forms, URL state, keyed field groups, filter and result presentation |
| `components/customer-forms.tsx`, `forms.tsx`, `use-unsaved-form.ts`, product editor, cart and settings pages | Repair review/progression, field protection, busy states and cart destination guidance |
| Account/auth/tracking/product pages, `AdminHead`, admin detail pages | Breadcrumb coverage, contextual returns and clearer destination labels |
| `components/recovery.tsx`, `error-recovery.tsx`, root/shop/admin recovery boundaries | Context-appropriate recovery destinations and one main/skip-link target after rendering |
| Catalogue/new-arrivals loading boundaries | Loading feedback without streaming private access checks early |
| `tests/navigation.test.ts`, `motion.test.ts`, `http.mjs` | Relationship, safe history, motion fallback and HTTP recovery regressions |

## Navigation and transitions

Next retains ownership of routing, prefetching and browser history. No `pushState`/`replaceState` wrappers, artificial entries, route-depth guesses, or remount keys are used for page navigation. GET search forms keep filters/sorting/pagination in URLs; keyed fieldsets synchronize controls when URL state changes.

Contextual Back invokes `router.back()` only for a relevant list origin established by a witnessed link navigation or the optional standard Navigation API's adjacent same-origin entry. Unsupported engines retain the witnessed-link behavior. A direct entry without relevant history has a canonical parent link. Breadcrumbs always show the canonical hierarchy. Returning to a list restores its saved scroll and originating link focus without removing that link from the normal Tab order. Snapshots are memory-only, bounded to 40 URLs; refreshing resets this extra cache and leaves native browser/Next restoration in control.

After the destination is ready, focus moves to its heading, to the result summary for filter updates, or to the originating list link on history return. Explicit search/hash destinations are respected. A streamed loading state is never focused as the completed page.

Known parent/detail relationships move by 12px in complementary directions; independent and sibling routes use a restrained opacity change. Query-only updates do not animate. RTL reverses directional motion. Only current content animates for 200ms; no old-page overlay or artificial network wait is created. Rapid navigations cancel the prior animation. Reduced motion disables CSS motion and skips/cancels Web Animations. Missing animation support changes no routing behavior.

The View Transitions API was evaluated against this async App Router architecture. Post-commit Web Animations avoids experimental React integration and async snapshot coordination while keeping the existing router. Shared-element transitions are not implemented.

An initial broad loading boundary caused private tracking 404 responses to stream as HTTP 200. The production HTTP suite exposed this regression. Loading boundaries were restricted to safe listing routes, and private/missing-route status checks pass again.

## Validation and measurements

Baseline: all 10 existing unit/workflow tests and TypeScript passed before implementation. The completed check results and browser observations are recorded below; repeat on final checkout with:

```sh
npm test
npm run typecheck
npm run build
npm run test:http
git diff --check
```

| Check | Result |
| --- | --- |
| Unit/workflow suite | 16 passed: 10 existing workflows plus 6 navigation/motion tests |
| TypeScript | Passed |
| Production build | Passed |
| Production HTTP suite | Passed: admin login, media, catalogue/variants/SEO, private tracking, repair quote/approval, request conversion, order status, statistics and role separation; missing-route status checks added |
| Browser catalogue | Search + stock + price order; product detail; contextual Back; browser Forward; deep entry and refresh; rapid top-level route changes; originating link remained keyboard-tabbable |
| Browser accessibility/repair | Heading/result focus; mobile Escape and trigger focus; route selection closed the menu; canceled dirty-form exit; step headings/review; complete repair submission and tracking recovery |
| Browser reflow | Desktop, tablet-width reflow (about 779 CSS px) and 200%/400% zoom, including approximately 340 CSS px width; no horizontal overflow on checked catalogue/product/repair states |
| Recovery | Unknown product displayed recovery actions with one main landmark and one skip-link target after hydration |
| Animation fallback | Unit tests verify reduced motion and absent Web Animations skip animation, complementary direction, neutral motion and RTL reversal |
| Lint | No lint script exists; not run |

Contrast calculations from the actual tokens: brand red/white **5.44:1**, deep red/white **7.62:1**, muted text/subtle background **6.83:1**, control border/white **3.64:1**. These are token-pair measurements, not a whole-application accessibility audit. Preferred target heights changed from 24px to 44px for breadcrumb/table links, 32px to 44px for footer links, and 36px to 44px for image-editor controls at the default root size.

Browser checks used explicitly labelled fictional products in a local database; no demo records or test credentials are committed. The browser extension itself produced an HTML-attribute hydration warning during automated cursor interaction. Its injected attributes were not suppressed in application code.

## Remaining improvements, by impact

1. **Draft recovery:** link exits and document unload are protected, but same-document browser Back cannot be reliably blocked across all supported engines with the existing router. No history trap was added. Long-form draft persistence, particularly the product editor, remains useful follow-up work; reload also clears the additional scroll/focus cache.
2. **Real users and assistive technology:** test representative Algerian customers/staff on Safari/iOS, Android and with screen readers. Collect completion, wrong-navigation/backtracking and recovery rates before claiming usability gains. Admin browser spot checks, a complete WCAG audit, OS-level reduced-motion testing and field performance/frame measurements remain unverified.
3. **Spatial polish:** evaluate shared-element product transitions only if real user testing supports the added integration complexity. French is the application's current language; RTL motion has unit coverage, but no translated RTL interface exists to validate end to end.

There are no application dialogs to retest beyond the native unsaved-exit confirmation and the non-modal menu disclosure. This change is prepared for repository review; it does not deploy or merge production.
