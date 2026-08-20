# Frontend

Admin dashboard for the Auth Service. Built with Next.js (App Router), React, TypeScript, and Tailwind CSS.

## Overview

The frontend is a web dashboard for administering the Auth Service: signing in, and managing users, roles, policies, permissions, and channels. It authenticates through NextAuth, fetches data with TanStack Query, and renders permission-aware UI so users only see actions they are allowed to perform.

## Tech Stack

- Next.js 16 (App Router) & React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui, Radix UI, Base UI (components)
- NextAuth (authentication & sessions)
- TanStack Query (server state)
- TanStack Table (data tables)
- Zustand (client state)
- dnd-kit (drag & drop)
- Recharts (charts)
- Sonner (toasts)
- ESLint & Prettier

## Folder Structure

```
auth-service-fe/
├── app/
│   ├── (sidebar)/        # Authenticated dashboard routes (users, roles, etc.)
│   ├── api/              # Route Handlers (incl. NextAuth) 
│   ├── login/            # Login page
│   ├── 403/              # Forbidden page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles / Tailwind entry
├── components/
│   ├── providers/        # Query, session, and theme providers
│   ├── shared/           # RBAC guards & entity form dialogs
│   └── ui/               # shadcn/ui primitives
├── constants/            # Enums, sidebar data, UI constants
├── dtos/                 # Data transfer object types
├── hooks/                # Data-fetching, dialog, and mutation hooks
├── lib/                  # API helpers, auth, RBAC, utilities
├── services/             # Backend API calls (per domain)
│   └── http/             # Fetch wrapper
├── types/                # Global type declarations
├── proxy.ts              # NextAuth route-guarding middleware
└── next.config.ts        # Next.js config (incl. /backend rewrite)
```

## Architecture

Short explanations of the main building blocks:

- **App Router** — Routes live under `app/`. Authenticated pages are grouped in `(sidebar)/`; API endpoints in `app/api/`.
- **Pages** — Each entity (users, roles, policies, permissions, channels) has a list route and a detail route (`[id]`).
- **Layouts** — A root layout wraps all pages; the `(sidebar)` layout adds the dashboard shell (sidebar + header).
- **Components** — Reusable UI split into `ui/` (primitives), `shared/` (guards and form dialogs), and feature components.
- **Services** — One module per domain in `services/`; each calls the backend through the shared `http` fetch wrapper.
- **Hooks** — Encapsulate queries (`use-*-query`), mutations, and dialog state.
- **DTOs** — Typed request/response shapes in `dtos/`, shared across services and components.
- **State management** — TanStack Query for server state; Zustand for local client state.
- **UI library** — shadcn/ui on top of Radix and Base UI, styled with Tailwind.
- **Forms & validation** — Entity form dialogs in `components/shared/`, driven by form hooks. Field validation is enforced primarily by the backend; the UI surfaces the returned errors. _TODO: document client-side validation if/when a schema library is adopted._

## Project Structure

Purpose of the major folders:

| Folder | Purpose |
| --- | --- |
| `app/` | Routes, layouts, and Route Handlers (App Router) |
| `components/` | UI primitives, RBAC guards, and feature components |
| `services/` | Typed calls to the backend API |
| `hooks/` | Query, mutation, and dialog hooks |
| `dtos/` | Shared request/response types |
| `lib/` | API base URLs, auth, RBAC helpers, utilities |
| `constants/` | Enums, sidebar config, UI constants |

## Authentication Flow

- Login is handled by **NextAuth** (`app/api/auth/[...nextauth]`).
- Credentials are submitted to the backend, which returns the user, their permissions, and an access/refresh token pair.
- Tokens and the API key are stored in the NextAuth session/JWT; the access token is refreshed automatically when it expires.
- `proxy.ts` (Next.js middleware) guards routes — unauthenticated or errored sessions are redirected to `/login`.
- The session's permission list drives RBAC guards (`Can`, `ProtectedRoute`, `GuestRoute`) so the UI adapts to what the user can access.

## API Communication

- Domain modules in `services/` call the backend using a shared fetch wrapper (`services/http/fetcher.ts`).
- The backend base URL comes from the server-only `AUTH_SERVICE_BASE_URL` variable (resolved via `lib/api.ts`).
- `next.config.ts` also defines a `/backend/:path*` rewrite to `AUTH_SERVICE_BASE_URL` for proxying requests.
- Requests attach the bearer access token and the `x-api-key` header for scope.

> Note: the codebase's own guideline is that backend access should route exclusively through the `/backend/*` rewrite, but services currently call `AUTH_SERVICE_BASE_URL` directly. See `lib/api.ts` / `ENGINEERING_AUDIT.md` for context.

## Styling

- **Tailwind CSS 4** — Utility-first styling; configured via PostCSS. Global styles and theme tokens live in `app/globals.css`.
- **shadcn/ui** — Prebuilt, accessible components (in `components/ui/`) built on Radix/Base UI and customizable in-repo. Configured via `components.json`.
- **Global styles** — `app/globals.css` imports Tailwind and theme variables, including light/dark theming via `next-themes`.

## Environment Variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_BASE_URL` | Public base URL of this frontend app (used to build absolute URLs back to itself) |
| `NEXTAUTH_SECRET` | NextAuth session encryption secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical URL NextAuth uses for callbacks (should match where the app is served) |
| `AUTH_SERVICE_BASE_URL` | Backend base URL. Server-only (no `NEXT_PUBLIC_` prefix) |
| `NEXT_PUBLIC_AUTH_SERVICE_BASE_URL` | Currently unreferenced; kept for parity — safe to leave unset |

See `.env.example` for a template.

## Getting Started

### Prerequisites
- Node.js
- A running instance of the backend (`auth-service-be`)

### Installation

```bash
npm install
cp .env.example .env   # then fill in the values
```

### Running Locally (Development)

```bash
npm run dev            # http://localhost:3000
```

### Production Build

```bash
npm run build          # build the app
npm start              # serve the production build
```

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the project with Prettier |
| `npm run typecheck` | Type-check with `tsc --noEmit` |

## Coding Guidelines

- **Components:** `PascalCase`; UI primitives live in `components/ui/`, feature/shared components in `components/shared/`.
- **Hooks:** `camelCase`, `use-` prefixed files (e.g. `use-users-query.ts`).
- **Services:** one file per domain (`*.service.ts`); no business logic in components.
- **DTOs:** typed shapes in `dtos/`, imported via the `@/` alias.
- **File organization:** colocate by responsibility (`services`, `hooks`, `dtos`, `components`).
- **Imports:** use the `@/*` path alias for internal modules; group external imports before internal ones.
- Run `npm run lint`, `npm run typecheck`, and `npm run format` before committing.

## Build & Deployment

```bash
npm run build
npm start
```

Ensure all environment variables are set in the target environment and that `AUTH_SERVICE_BASE_URL` points at a reachable backend. _TODO: document the specific hosting target (e.g. Vercel, Node server, container)._

## Troubleshooting

| Issue | Likely cause / fix |
| --- | --- |
| Redirected to `/login` in a loop | Invalid/expired session or missing API key — check backend availability and credentials |
| "Base URL is not defined" error | `NEXT_PUBLIC_BASE_URL` is not set |
| "Auth Service Base URL is not defined" error | `AUTH_SERVICE_BASE_URL` is not set |
| API calls fail | Backend not running or `AUTH_SERVICE_BASE_URL` points at the wrong host |
| `403` page shown | The signed-in user lacks the required permission |
| NextAuth callback errors | `NEXTAUTH_URL` / `NEXTAUTH_SECRET` misconfigured |
