# Frontend Development Rules â€” NeoCentral

This file is a frontend-specific projection. Business truth remains in root
`AGENTS.md`, `KONTEKS_KANONIS_SIMPTA.md` **v3.3**, and `prdpurpose.md` **v8.3**. See root `AGENTS.md`.
Technical truth remains in root `.cursor/rules/20-website-frontend.mdc`.

## Mandatory preflight

1. Check reuse in `src/components/ui`, feature components, hooks, services,
   stores, and types before creating a new component.
2. Inspect the backend response/Swagger contract; do not infer fields or status values.
3. For SIMPTA, read the relevant canon/PRD/KC entry before changing user behavior.

## Structure and state

- Pages are composition-only; move complex logic to components/hooks/services.
- Server state uses TanStack Query. Zustand is UI/client state only.
- Invalidate all affected query keys after successful mutations.
- Reuse shadcn/ui; do not modify base UI components unless fixing the base itself.
- Use `Loading`/`Spinner`, Sonner toast, and `AlertDialog`; never browser `confirm()`.
- Use `@/lib/text` helpers for names, roles, and dates.
- Keep TypeScript strict and avoid `any`.

## Protected-layout contract

- Use `useOutletContext<LayoutContext>()` and set title/breadcrumbs in `useEffect`.
- The root page container uses vertical spacing only, e.g.
  `<div className="space-y-5 sm:space-y-6">`.
- Do not add root `p-4`, `p-6`, horizontal margin, or top padding; layout owns it.
- Navigable breadcrumb parents include `href`; current page omits it.

## SIMPTA invariants that commonly regress

- Path C copy and behavior are lecturer-first, then KaDep.
- Do not expose Booking/Pending KaDep/Overquota Sah internals to students.
- TA-04 early is not active promotion; `takingThesisCourse` is post-TA-03 lifecycle input.
- P1/P2 informal-log access is read-only after TA-04.

Run `pnpm lint`, `pnpm build`, and `pnpm test` before handoff.
