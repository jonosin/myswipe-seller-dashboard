# Myswipe Seller Dashboard (UI-only Mock)

A black-and-white, accessible seller dashboard mock for Myswipe built with Next.js 14 (App Router), TypeScript, TailwindCSS, Zustand, Zod, React Hook Form, Radix Primitives, and Sonner toasts. No external auth or payment SDKs; all data is in-memory with mocked latency.

## Stack
- Next.js 14 (App Router) + TypeScript
- TailwindCSS (neutral/zinc palette only)
- Zustand (in-memory store, persisted to sessionStorage)
- Zod + React Hook Form (forms/validation)
- Radix UI Primitives (dialogs)
- Sonner (toasts)

## Project Structure
```
app/
  layout.tsx
  page.tsx (redirect -> /dashboard)
  login/page.tsx
  dashboard/page.tsx
  products/page.tsx
  orders/page.tsx
  shipping/page.tsx
  payouts/page.tsx
  settings/page.tsx
components/
  sidebar.tsx
  topbar.tsx
  breadcrumbs.tsx
  kpi-card.tsx
  status-badge.tsx
  data-table.tsx
  product-form.tsx
  order-detail-drawer.tsx
  shipping-profile-form.tsx
  payout-onboarding.tsx
  payout-alert.tsx
  confirm-dialog.tsx
  toast.tsx
  auth-gate.tsx
data/
  products.ts
  orders.ts
  payouts.ts
  shipping.ts
lib/
  types.ts
  utils.ts
  store.ts
  repo.ts
public/
  placeholder.svg
styles/
  globals.css
```

## Quick Start
1. Install dependencies
```bash
npm install
```
2. Run the dev server
```bash
npm run dev
```
3. Open http://localhost:3000
4. Sign in at `/login` with any email/password

## Information Architecture & Flows
- `/login`: mock sign-in (toggles `isAuthenticated` in Zustand), redirects to `/dashboard`.
- `/dashboard`: KPI cards (Total Sales, Pending Payouts, Active Listings, Orders in Transit), recent orders (5), onboarding alert if payout setup incomplete.
- `/products`: tabs (All/Active/Draft), search, category filter, pagination, bulk select, Add/Edit Product drawer with Zod validation and mock image upload/drag-drop.
- `/orders`: status/date filters, searchable by id/email, click row to open detail drawer with buyer/timeline; “Mark as fulfilled” updates state + toast.
- `/shipping`: origin address and handling time, list of Shipping Profiles (create/edit/delete) with validation.
- `/payouts`: balance, schedule, next payout, onboarding checklist (identity, bank, tax), history table with status filter.
- `/settings`: store profile (name, slug), contact email, return policy, masked tax ID placeholder, notification toggles.

## Theming
- Black & white only via Tailwind neutral/zinc shades. Subtle borders and shadows. Focus-visible rings enabled.

## Accessibility
- Semantic headings, ARIA labels, keyboard-friendly dialogs, focus rings, table headers, and a “Skip to content” link.

## Mock Data & Latency
- Data resides in `data/*.ts` and `lib/repo.ts`. Repository functions use `setTimeout` to simulate fetch latency.
- In-memory mutations are not persisted across server restarts.

## Where to Wire Real Services Later
- Auth: Replace `components/auth-gate.tsx` + `lib/store.ts:isAuthenticated` with a real provider (e.g., Auth0/Clerk). Guard routes at the server or middleware level.
- Products API: Swap calls in `lib/repo.ts` with real fetch/GraphQL; add Next Route Handlers under `app/api/` if needed.
- Orders API: Replace `listOrders()`/`updateOrderStatus()` in `lib/repo.ts`.
- Payouts: Replace `getPayout()` and `components/payout-onboarding.tsx` with real Stripe Connect onboarding state.
- Shipping: Replace profile CRUD and settings functions in `lib/repo.ts`.
- Settings: Persist `lib/store.ts` slices to your backend.

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm start` – run production server
- `npm run lint` – Next lint

## Notes
- This is a UI-only mock. No external network calls are required. Images use a local `public/placeholder.svg`.
- Server and client components are used pragmatically; repository functions are client-safe and simulate latency.
# myswipe-seller-dashboard
