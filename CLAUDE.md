# CLAUDE.md — auth-service-fe

Guidance for Claude Code (and any contributor) working in this repository. This
reflects the architecture **as it actually exists today** — follow existing patterns
exactly rather than introducing new ones for problems already solved.

This file complements, and must stay consistent with, [`AGENTS.md`](./AGENTS.md) (the
strict, enforced rulebook — treat any conflict between the two as a bug in this file)
and [`README.md`](./README.md). See [`ENGINEERING_AUDIT.md`](./ENGINEERING_AUDIT.md)
for known, documented deviations before "fixing" something that looks inconsistent.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript (strict)
- `next-auth` (Credentials provider, JWT session strategy) for auth
- TanStack Query (server state) + Zustand (local UI state, one store per dialog)
- Tailwind CSS v4 (CSS-based config in `app/globals.css`, no `tailwind.config.*`)
- shadcn/Radix UI primitives, `@hugeicons/react` for icons
- Native `fetch` only — **no axios/ky/other HTTP client**, anywhere in this repo
- No test framework is currently installed (a documented gap — don't assume Jest/Vitest
  exists when asked to add tests; ask before adding a new one)

## ⚠️ Core Architecture Rule — Client Components Never Call the Backend

**This is the single most important rule in this codebase. No exceptions.**

Client components (`"use client"`) may only call this app's own `/api/*` route
handlers. They must **never**:

- Contain a backend URL or read `AUTH_SERVICE_BASE_URL` /
  `NEXT_PUBLIC_AUTH_SERVICE_BASE_URL`
- `fetch()` the backend directly, or call `/backend/*` directly
- Import a `services/*.service.ts` function directly (those are server-only)

The real backend hop happens in two layers, both server-side only:

```
Client Component                    Server (this Next.js app)              Backend
─────────────────                   ──────────────────────────             ───────
fetch("/api/users")   ─────────▶    app/api/users/route.ts
                                       - getServerSession(authOptions)
                                       - calls services/user.service.ts
                                       - services/*.service.ts hits the
                                         backend (see note below)   ───▶    auth-service-be
                                     ◀───────────────────────────────
                     ◀─────────────  NextResponse.json(response)
```

**Where to add the proxy for a new resource**: create
`app/api/<resource>/route.ts` (+ `app/api/<resource>/[id]/route.ts` for
item-level ops), following the existing pattern in e.g. `app/api/users/route.ts`:

```ts
export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    const accessToken = session?.access_token
    const apiKey = session?.api_key
    if (!session?.user?.email || !apiKey || !accessToken) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const { search: queryString } = new URL(request.url)
    const response = await getUsers({ queryString, accessToken, apiKey })
    return NextResponse.json(response)
}
```

Then call it from client components with a plain relative `fetch`:

```ts
const response = await fetch(`/api/users?${searchParams.toString()}`, { cache: "no-store" })
```

**Backend URL rule** (from `AGENTS.md`, still authoritative): the backend is reached
exclusively via the `/backend/*` rewrite in `next.config.ts`
(`AUTH_SERVICE_BASE_URL` → `/backend/:path*`), and `AUTH_SERVICE_BASE_URL` must never
be read outside `next.config.ts`.

> **Known deviation, not a pattern to copy**: every `services/*.service.ts` file
> currently reads `AUTH_SERVICE_BASE_URL` directly (via `lib/api.ts`'s
> `getAuthServiceBaseUrl()`) and calls the backend's real path instead of going through
> the `/backend/*` rewrite, and a handful of server-component detail pages
> (`app/(sidebar)/*/[id]/page.tsx`) call `services/*.service.ts` directly instead of
> going through `app/api/**/route.ts`. Both are server-only, so nothing leaks to the
> browser, and it's tracked in `ENGINEERING_AUDIT.md` as a consistency issue, not a
> security one. **Don't extend this deviation into new code** — new route handlers
> should call the backend via the `/backend/*` rewrite (see `AGENTS.md`'s sample), and
> new server components that need backend data should go through `/api/*` like client
> components do, unless you're explicitly matching an existing file for consistency.

## Folder Structure

```
app/
  (sidebar)/            Route group = authenticated shell. One folder per entity
                          (users/, roles/, policies/, permissions/, channels/), each with
                          page.tsx (list), [id]/page.tsx (detail, server component),
                          <Entity>DataTable.tsx, <Entity>Information.tsx.
  api/                   Route handlers ONLY — the proxy layer. One folder per resource,
                          mirroring backend routes (kebab-case for multi-word resources).
  login/, 403/            Standalone routes outside the sidebar group.
  layout.tsx              Mounts providers + all entity form dialogs globally (opened
                          imperatively via their use-*-form-dialog hooks, no prop drilling).
components/
  ui/                     Vendored shadcn/Radix primitives — treat as vendored, compose
                          around them rather than editing directly.
  shared/                 App-specific composites: RBAC gates (Can.tsx, ProtectedRoute.tsx,
                          GuestRoute.tsx) and one <entity>-form-dialog/ folder per entity
                          (component + its own Zustand store).
  providers/              QueryClient provider, SessionProvider, etc.
constants/               enums/index.ts, sidebarData.tsx (nav + requiredPermissions), ui.ts
dtos/                     One <Entity>Dto.ts per resource (request/response shapes) + index.ts
hooks/                    use-<entity>-query.ts (TanStack Query), use-<entity>-form-dialog.ts,
                          use-delete-<entity>.ts, use-entity-form-mutation.ts (shared)
lib/                      rbac.ts, next-auth.ts, api.ts, api-error.ts,
                          fetch-with-access-result.ts, utils.ts (cn helper), format-date.ts
services/                 One <resource>.service.ts per backend resource — SERVER ONLY,
                          never import these from a client component. services/http/fetcher.ts
types/                    next-auth.d.ts — NextAuth module augmentation only.
proxy.ts                  Edge auth gate (Next 16's renamed middleware.ts) via next-auth's withAuth.
next.config.ts            Defines the /backend/* rewrite — the only file allowed to read
                          AUTH_SERVICE_BASE_URL.
```

New resource → add, in parallel: `dtos/<Entity>Dto.ts`, `services/<entity>.service.ts`,
`app/api/<entity>/route.ts` (+ `[id]/route.ts`), `hooks/use-<entity>s-query.ts`, and if
it needs a create/edit form, `components/shared/<entity>-form-dialog/`. Use `channel`
or `permission` as the reference implementation — smallest, cleanest end-to-end example.

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Entity components | PascalCase | `UsersDataTable.tsx`, `UserFormDialog.tsx` |
| One-off/page-level components | kebab-case | `login-form.tsx`, `app-sidebar.tsx` |
| Hook files | kebab-case, `use-` prefix | `use-users-query.ts`, `use-delete-user.ts` |
| Hook exports | camelCase, `use` prefix | `useUsersQuery`, `useDeleteUser` |
| Zustand store files | kebab-case, `-store` suffix | `user-form-store.ts` |
| Service files | kebab-case, `.service.ts` suffix | `user.service.ts`, `role-policy.service.ts` |
| Service functions | camelCase verbs | `getUsers`, `addUser`, `updateUser`, `deleteUser` |
| API route folders | kebab-case | `app/api/user-profile/route.ts` |
| Dynamic route segments | `[camelCaseId]` | `[userId]`, `[roleId]`, `[policyId]` |
| DTO files/types | PascalCase, `Dto` suffix | `UserDto.ts` → `UserDto`, `CreateUserDto`, `UpdateUserDto` |
| Enums | PascalCase name + `Type` suffix, lower_snake values | `UserLevelType.root_superadmin` |
| Variables | camelCase | `userData`, `isLoading` |

## State Management

- **Server state**: TanStack Query. Name query hooks `use<Entity>Query`/
  `use<Entity>sQuery`, and export a `<entity>QueryKeys` object alongside the hook for
  cache-key consistency (see `hooks/use-users-query.ts`).
- **Mutations**: reuse the shared `useEntityFormMutation` (create/update, parameterized
  by `createUrl`/`updateUrl`/`queryKey`/`entityName`) rather than writing a bespoke
  mutation hook. Delete flows are hand-rolled per entity (`use-delete-<entity>.ts`) with
  confirm + toast — follow that shape for new deletes rather than generalizing it
  further.
- **UI-only state**: a Zustand store per entity dialog holding only `isOpen`/`mode`/the
  entity being edited — never cache server data in Zustand, that's TanStack Query's job.

## Forms

No form library is installed — forms are plain controlled inputs with local `useState`
and manual `onSubmit`, validated by HTML `required` plus backend error responses
surfaced via toast (`sonner`). Match this pattern for new forms unless the team decides
to adopt a form library, since introducing one for a single form would create two
inconsistent patterns for the same problem.

## Auth & RBAC

- Tokens (`access_token`, `api_key`, refresh token) live only inside the NextAuth JWT
  session cookie — never read/write them to `localStorage` or a plain cookie yourself.
- Silent refresh is handled centrally in `lib/next-auth.ts` (`refreshAccessToken`,
  dedup'd via an in-memory lock) — don't add ad hoc token-refresh logic elsewhere.
- Three layers of RBAC gating, use the one matching where you are:
  - **Edge**: `proxy.ts` (session/token existence) — don't add per-page redirect logic
    here, it's route-matcher based.
  - **Route/page (server component)**: wrap with `ProtectedRoute`/`GuestRoute`
    (`components/shared/`).
  - **Within a component**: `<Can>` (`components/shared/Can.tsx`) for conditional
    rendering, or `lib/rbac.ts`'s `hasPermission`/`isSuperadmin`/`checkPermission`
    directly. `root_superadmin`/`superadmin` always bypass permission checks — don't
    add a redundant explicit check for those levels.
  - **Nav**: add `requiredPermissions` to the entry in `constants/sidebarData.tsx`
    rather than conditionally rendering nav items inline.

## Environment Variables

| Variable | `NEXT_PUBLIC_`? | Read from |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Yes | Client-safe — this app's own URL, used to build absolute `/api/*` URLs where a relative path isn't available |
| `AUTH_SERVICE_BASE_URL` | **No** | `next.config.ts` only (see Core Architecture Rule above) |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | No | NextAuth internals |

Never add a new `NEXT_PUBLIC_*` variable that points at the backend — that's exactly
the mistake the `/backend/*` rewrite exists to prevent. (`NEXT_PUBLIC_AUTH_SERVICE_BASE_URL`
exists in old `.env` examples but is dead/unused — don't resurrect it.)

## Style / Tooling

- Prettier: no semicolons, double quotes, 4-space indent, `prettier-plugin-tailwindcss`
  auto-sorts Tailwind classes — don't hand-order utility classes.
- ESLint: `eslint-config-next` + `@typescript-eslint`; unused vars/args prefixed `_` are
  allowed.
- Run `npm run lint`, `npm run format`, and `npm run typecheck` before considering a
  change done.
- **Consistency rule** (from `AGENTS.md`): if a pattern already exists in the codebase
  for a given concern, replicate it exactly — don't introduce a second way to do the
  same thing (e.g. a second HTTP client, a second form pattern, a second mutation hook
  shape).
