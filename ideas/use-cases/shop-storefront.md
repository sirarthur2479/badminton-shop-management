# Use Case: Public Storefront for Badminton Pro Shop

**Date:** 2026-06-23
**Status:** planned (TASK-001 → TASK-012)

## Problem / motivation

Shop owner stocks 100–300 expensive badminton items (rackets, bags, shoes, strings) but has no online presence. Customers who don't visit the club in person never discover his prices. He wants to advertise his stock publicly so people across Auckland and NZ can find him, compare prices, and come in.

The existing stringing queue app solves a different problem (one the owner doesn't actually have — his paper system works fine). The storefront is the real ask.

## Target users

- **Customers / prospective buyers** — browse products on phone or desktop; contact shop when interested
- **Shop owner** — add/manage products from iPad or phone; receive inquiry emails; manage the public page content

## Desired outcome

1. A public `/shop` URL the owner can share that shows his products with prices
2. Owner can add products easily (barcode scan → auto-fill, or CSV import from Google Sheets)
3. Customers can browse by category, search by name, and contact the shop via WhatsApp/email
4. Staff panel extended to manage products, settings, sales, and incoming inquiries

## Constraints

- **Tech:** React 18 + Vite + Tailwind CSS v3 + Supabase + GitHub Pages — stay on this stack
- **Cost:** Free tier only (Supabase free, GitHub Pages free)
- **No checkout:** Browse + contact model only in Phase 1 — no payment processing
- **Non-goals:** SSR/Next.js migration, service workers, multi-tenant auth, Stripe

## Open questions

- [x] Build vs buy → Build (Shopify too expensive for unproven value)
- [x] Image hosting → Supabase Storage in Phase C; URL field in Phase B MVP
- [x] Inquiry flow → Direct WhatsApp/email per product in Phase B; inquiry cart in Phase C
- [ ] What accent colour does the owner prefer? (default: green — can be changed in Shop Settings)
- [ ] Does the owner have existing product photos? (affects Phase C priority)

## Links

- Inspiration: pool.md / big idea discussion 2026-06-23
- Plan: `.claude/plans/big-idea-comming-discussed-starry-scroll.md`
- Backlog: TASK-001 through TASK-012
