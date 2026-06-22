# TASK-002 — Install shadcn/ui (Tailwind v3 compatible)

**Use case:** [ideas/use-cases/shop-storefront.md](../../ideas/use-cases/shop-storefront.md)
**Research:** —
**Depends on:** —
**Effort:** S
**Risk:** medium
**Status:** todo

## Goal

Install shadcn/ui in the project so the storefront and admin UI can use production-quality Card, Badge, Button, Sheet, Dialog, Input, and Separator components. The project uses **Tailwind CSS v3** — the shadcn CLI defaults to v4 and will break the existing styling if run naively. This task pins the correct version and installs only the needed components.

## Acceptance criteria

- [ ] shadcn/ui components available at `src/components/ui/` (Card, Badge, Button, Sheet, Dialog, Input, Separator)
- [ ] Existing kiosk and staff pages render identically after install (no Tailwind upgrade, no style regressions)
- [ ] `npm run dev` starts without errors; `npm run build` passes
- [ ] The project's existing `Button` and `SelectField` components in `src/components/shared/` are untouched — they coexist with shadcn components

## Test plan

```
shadcn-smoke.test.jsx

- Card renders its children
- Badge renders with default variant
- Button renders (shadcn) — does not conflict with existing Button in shared/
- Sheet opens and closes
```

## Implementation plan

### 1. Verify current Tailwind version
```
npm list tailwindcss
```
Confirm it's `3.x`. Do NOT upgrade.

### 2. Install shadcn using the legacy (v3-compatible) path
shadcn `@2.x` supports Tailwind v3. Do not use `npx shadcn@latest init`.

```bash
npx shadcn@2.1.0 init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Location: `src/components/ui`

This writes `components.json` and adds CSS variables to `src/index.css` without touching `tailwind.config.js` in a v4-breaking way.

### 3. Add required components
```bash
npx shadcn@2.1.0 add card badge button sheet dialog input separator
```

### 4. Verify no Tailwind version bump
Check `package.json` — tailwindcss must still be `^3.x`. If shadcn tried to upgrade it, revert `package.json` and `package-lock.json` for that entry only.

### 5. Smoke test existing pages
Run `npm run dev`, open `/` (kiosk) and `/staff` (staff) — confirm no visual regressions.

### Note on naming conflict
The project already has `src/components/shared/Button.jsx`. The shadcn Button lands at `src/components/ui/button.jsx` (lowercase). They don't conflict — import paths are explicit. Existing code uses `../shared/Button`; new shop code will use `../ui/button`. No rename needed.
