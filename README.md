# auth-service-fe

Admin console for **auth-service** — a multi-tenant (channel-scoped) RBAC system. This
app lets operators manage users, roles, policies, permissions, and channels, and
authenticates against the [auth-service-be](../auth-service-be) API.

## Overview

Built on Next.js 16 (App Router) + React 19. All backend communication is intended to
be proxied through this app's own `/api/*` route handlers (see
[API Integration](#api-integration) for where the current code deviates from that
rule). Authentication is handled by NextAuth with a credentials provider backed by the
auth service's JWT login endpoint; RBAC gating happens both at the route level (server
components redirecting unauthorized users) and at the component level (conditionally
rendering actions a user isn't permitted to perform).

## Features

- Email + password + API key login (`/login`), with silent access-token refresh and
  automatic sign-out on refresh failure
- Entity management for **Users**, **Roles**, **Policies**, **Permissions**, and
  **Channels** — paginated/searchable/sortable list views plus detail pages
- Relationship management: assign Roles to Users, Policies to Roles, and Permissions to
  Policies via dedicated dialogs on each entity's detail page
- Permission-aware UI: sidebar links, action buttons (Add/Edit/Delete), and entire
  routes are hidden or redirect to `/403` based on the signed-in user's permissions
  (superadmin/root_superadmin bypass all checks)
- Dark/light theme (defaults to dark)

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Auth | NextAuth 4 (JWT session strategy, Credentials provider) |
| Server state | TanStack Query v5 |
| Client UI state | Zustand v5 (one store per entity dialog) |
| Tables | TanStack Table v8 |
| UI components | shadcn/ui (Radix UI primitives, `radix-mira` style), Hugeicons |
| Styling | Tailwind CSS v4 (CSS-based config, no `tailwind.config.*`) |
| HTTP client | Native `fetch` only — no axios/ky, per [AGENTS.md](./AGENTS.md) |
| Toasts | sonner |

## Folder Structure

```
app/
  (sidebar)/            Authenticated shell — layout + one folder per entity
    users/ roles/ policies/ permissions/ channels/
      page.tsx           List view (client DataTable)
      [id]/page.tsx       Detail view (server component) + relation-management dialogs
  login/                 Login page (GuestRoute-gated)
  403/                   Static "Access Denied" page
  api/                   Route handlers proxying to the backend (see API Integration)
components/
  ui/                     shadcn/Radix primitives (button, dialog, data-table, ...)
  shared/                 App-specific: Can/ProtectedRoute/GuestRoute (RBAC gates),
                          one form-dialog + Zustand store per entity
  providers/              ThemeProvider, SessionProvider, QueryProvider
constants/                Enums, sidebar nav config
dtos/                     Request/response type definitions per resource
hooks/                    use-*-query (TanStack Query), use-*-form-dialog, use-delete-*
lib/                      rbac.ts, next-auth.ts, api.ts, fetch-with-access-result.ts, ...
services/                 One file per backend resource + services/http/fetcher.ts
types/                    NextAuth module augmentation
```

## Component Architecture

- **`components/ui/`** — low-level shadcn/Radix primitives, generated via
  `npx shadcn add`. Treat as vendored; prefer composing over editing directly.
- **`components/shared/`** — app-specific composites:
  - `Can.tsx` — client component that conditionally renders children based on a
    permission check (used inline for Add/Edit/Delete buttons)
  - `ProtectedRoute.tsx` / `GuestRoute.tsx` — server components that redirect based on
    session presence and (for `ProtectedRoute`) a required permission
  - `*-form-dialog/` — one create/edit dialog + Zustand store per entity (user, role,
    policy, permission, channel), plus `confirm-dialog/` for delete confirmations. All
    five dialogs are mounted once, globally, in `app/layout.tsx`, and opened
    imperatively from anywhere via the matching `use-*-form-dialog.ts` hook — this
    avoids prop-drilling dialog open/close state through the component tree.
- **Entity pages** — each entity has a client `<Entity>DataTable.tsx` (list, built on
  `components/ui/data-table.tsx` + TanStack Table) and a server `[id]/page.tsx` +
  `<Entity>Information.tsx` (detail).

## State Management

- **Server state**: TanStack Query (`hooks/use-*-query.ts`), one `QueryClient` per app
  mount (`components/providers/query-provider.tsx`). Create/update mutations go
  through the shared [`useEntityFormMutation`](./hooks/use-entity-form-mutation.ts)
  hook (toast + `invalidateQueries` logic, previously duplicated across all five entity
  dialogs); delete flows are hand-rolled per entity (`use-delete-*.ts`).
- **UI-only state**: Zustand, one store per entity dialog (`isOpen`, `mode`, the entity
  being edited) — never used for server data.
- **Theme**: `next-themes`, default dark, `enableSystem={false}`.
- **Session**: NextAuth's `SessionProvider` (`refetchInterval={30}`), plus a
  `SessionWatcher` that force-signs-out the client if the session carries a refresh
  error.

## Authentication Flow

1. `/login` collects email, password, and an API key (`components/login-form.tsx`,
   plain controlled inputs — no form library) and calls NextAuth's
   `signIn("credentials", ...)`.
2. NextAuth's `authorize()` (`lib/next-auth.ts`) calls
   `services/auth.service.ts`'s `loginWithCredentials`, which hits the backend's
   `POST /api/auth/generate-token` with the API key in `x-api-key`.
3. On success, the access token, refresh token, user record, and resolved permissions
   are packed into the NextAuth JWT session — **never** exposed to the browser outside
   what `useSession()`/`getServerSession()` return, and never stored in localStorage or
   a plain cookie.
4. On each session read, the `jwt` callback checks whether the access token is within
   30 seconds of expiring; if so, it silently calls the backend's
   `POST /api/auth/refresh-token`, deduplicated via an in-memory lock keyed by the
   refresh token so concurrent requests don't trigger duplicate refreshes.
5. Logout (`signOut()`) triggers NextAuth's `events.signOut`, which calls
   `POST /api/auth/destroy-token` to revoke the refresh token server-side.
6. Edge-level route protection lives in **`proxy.ts`** (Next.js 16 renamed
   `middleware.ts` to `proxy.ts` — this repo uses the new name), using
   `next-auth/middleware`'s `withAuth`, requiring a valid, error-free token. Page-level
   protection additionally uses `ProtectedRoute`/`GuestRoute` server components.

## Authorization / RBAC

- `lib/rbac.ts` exports `hasPermission`, `isSuperadmin`, and `checkPermission` — mirrors
  the backend's permission-check semantics: `root_superadmin`/`superadmin` bypass all
  checks; everyone else needs at least one (or all, if `requireAll`) of the required
  permission ref-names in their session's `permissions` array.
- **Route level**: `ProtectedRoute` (wraps `(sidebar)` pages) redirects to `/login` if
  unauthenticated, `/403` if a required permission is missing.
- **Component level**: `Can` conditionally renders Add/Edit/Delete controls inline.
- **Nav level**: `constants/sidebarData.tsx` declares `requiredPermissions` per sidebar
  link; links the user can't access are hidden entirely.
- Permission ref-names follow the backend's `auth:<action>:<resource>` convention
  (e.g. `auth:view:user`, `auth:admin:role`) — see
  [auth-service-be's RBAC docs](../auth-service-be/README.md#authorization--rbac) for
  how these are resolved server-side.

## API Integration

**Intended architecture** (per this repo's [AGENTS.md](./AGENTS.md)): client components
call this app's own `/api/*` route handlers; those handlers alone call the backend, via
the `/backend/*` rewrite defined in `next.config.ts`; `AUTH_SERVICE_BASE_URL` should
never be read outside `next.config.ts`.

> [!warning] Known deviations from the stated architecture — not yet fixed
> - Every `services/*.service.ts` file reads `AUTH_SERVICE_BASE_URL` directly
>   (via `lib/api.ts`'s `getAuthServiceBaseUrl()`) and calls the backend's `/api/*`
>   path directly, bypassing the `/backend/*` rewrite entirely.
> - The six entity detail pages (`app/(sidebar)/*/[id]/page.tsx`) call
>   `services/*.service.ts` functions directly as server components, bypassing this
>   app's own `/api/*` route handlers for those reads.
> - Within `app/api/users/[userId]/route.ts`, the `GET` handler actually does follow
>   the stated rewrite pattern (raw `fetch` to `/backend/users/:id`), while `PUT`/
>   `DELETE` in the same file use the service-layer pattern above — the file is
>   internally inconsistent.
>
> None of this is a client-side secret-exposure risk (`AUTH_SERVICE_BASE_URL` has no
> `NEXT_PUBLIC_` prefix, so it never reaches the browser either way), but it is a real
> deviation from the codebase's own documented rule. See `ENGINEERING_AUDIT.md` for the
> recommendation — this wasn't fixed as part of this pass since routing ~9 call sites
> through `/api/*` is an architecture change, not a bug fix.

**Endpoint mapping** — `services/*.service.ts` → backend route:

| Service | Backend endpoint(s) |
|---|---|
| `auth.service.ts` | `POST /api/auth/{generate-token,refresh-token,destroy-token}` |
| `user.service.ts` | `GET/POST /api/users`, `GET/PUT/DELETE /api/users/:id` |
| `role.service.ts` | `GET/POST /api/roles`, `GET/PUT/DELETE /api/roles/:id` |
| `policy.service.ts` | `GET/POST /api/policies`, `GET/PUT/DELETE /api/policies/:id` |
| `permission.service.ts` | `GET/POST /api/permissions`, `GET/PUT/DELETE /api/permissions/:id` |
| `channel.service.ts` | `GET/POST /api/channels`, `GET/PUT/DELETE /api/channels/:id` |
| `policy-permission.service.ts` | `GET/PUT /api/policy-permission/policy/:policy_id` |
| `role-policy.service.ts` | `GET/PUT /api/role-policy/role/:role_id` |
| `user-role.service.ts` | `GET/PUT /api/user-role/user/:user_id` |

For the full backend API contract (parameters, validation, response shapes), see
[auth-service-be's Swagger docs](../auth-service-be/README.md#api-documentation).

## Routing

App Router, no `src/` directory:

| Route | Purpose |
|---|---|
| `/` | Placeholder dashboard (not currently linked from the sidebar nav) |
| `/login` | Login form |
| `/403` | Static access-denied page |
| `/users`, `/users/[userId]` | User list / detail (+ role assignment) |
| `/roles`, `/roles/[roleId]` | Role list / detail (+ policy assignment) |
| `/policies`, `/policies/[policyId]` | Policy list / detail (+ permission assignment) |
| `/permissions`, `/permissions/[permissionId]` | Permission list / detail |
| `/channels`, `/channels/[channelId]` | Channel list / detail |

## Styling

Tailwind CSS v4 (CSS-based config — no `tailwind.config.*` file; see
`app/globals.css` for the `@theme inline` token mapping and OKLCH light/dark palette).
shadcn/ui components configured via `components.json` (`style: "radix-mira"`,
`baseColor: "neutral"`, icons via `@hugeicons`). Use the `cn()` helper
(`lib/utils.ts`) for conditional class composition; Prettier's Tailwind plugin
auto-sorts class names on save/format.

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Yes | This app's own base URL (client-exposed) |
| `NEXT_PUBLIC_AUTH_SERVICE_BASE_URL` | No | Present historically; unreferenced in code today |
| `NEXTAUTH_SECRET` | Yes | Session JWT encryption key — keep private, generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Canonical URL for NextAuth callbacks |
| `AUTH_SERVICE_BASE_URL` | Yes | Backend base URL — server-only, never sent to the browser |

## Build & Deployment

```bash
npm install
npm run build
npm start          # serves the production build
```

No Dockerfile exists in this repo yet (plain Node deployment only) — see
`ENGINEERING_AUDIT.md` for this as a Nice-to-Have. Required at deploy time: all five
env vars above, plus a reachable `auth-service-be` instance.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Stuck redirect loop between `/login` and app pages | `NEXTAUTH_SECRET`/`NEXTAUTH_URL` misconfigured, or the backend is unreachable so login never returns tokens |
| "Base URL is not defined" error | `NEXT_PUBLIC_BASE_URL` not set |
| "Auth Service Base URL is not defined" error | `AUTH_SERVICE_BASE_URL` not set |
| Logged in but every page redirects to `/403` | The signed-in user has no roles/policies/permissions assigned on the backend, or the wrong `x-api-key` was used at login (wrong channel scope) |
| Session silently logs out after ~2 minutes of inactivity mid-session | Expected — access tokens are short-lived (2 min) and refresh silently on activity; if the backend's refresh token has also expired (7 days) or was revoked, `SessionWatcher` force-signs-out |

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (writes) |
| `npm run typecheck` | `tsc --noEmit` |

## Screenshots

Live capture was attempted against a running dev server + seeded local database, but
the available browser-automation tooling's screenshot/zoom capture consistently timed
out in this environment (page loads, console, network, and the DOM/accessibility tree
all worked fine — only pixel capture failed), and completing the login flow to reach
authenticated pages would have required passing the real superadmin password as a tool
call parameter, which isn't something to do even for a local dev credential. Falling
back to placeholders.

To capture these yourself:

1. Ensure PostgreSQL is running and reachable per `auth-service-be/.env`.
2. `cd auth-service-be && npm run seed` (skip if already seeded).
3. `npm run dev` in both `auth-service-be` (port 4000) and this repo (port 3000).
4. Log in at `http://localhost:3000/login` with the seeded superadmin credentials
   (`SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD` from `auth-service-be/.env`) and API key
   `global`.
5. Capture at 1280×800: `/login` (pre-auth), `/`, `/users` + `/users/[id]`, `/roles` +
   `/roles/[id]`, `/policies` + `/policies/[id]`, `/permissions` +
   `/permissions/[id]`, `/channels` + `/channels/[id]`, and `/403` (visit as a
   lower-privileged seeded user, or a route requiring a permission that user lacks).
6. Save into `public/screenshots/` and reference here, e.g.
   `![Users list](public/screenshots/users-list.png)`.

| Page | Screenshot |
|---|---|
| Login | _pending — see above_ |
| Dashboard (`/`) | _pending_ |
| Users list / detail | _pending_ |
| Roles list / detail | _pending_ |
| Policies list / detail | _pending_ |
| Permissions list / detail | _pending_ |
| Channels list / detail | _pending_ |
| 403 | _pending_ |

---

See [`ENGINEERING_AUDIT.md`](./ENGINEERING_AUDIT.md) for the full architecture/quality
audit, including the items flagged above.
