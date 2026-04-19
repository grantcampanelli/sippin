# Sippin — Enhancement Proposals

A menu of concrete enhancements, ordered roughly by effort. Every proposal here is **additive** — no destructive schema changes, no renames of existing fields. Pick what's interesting; each item is self-contained enough to ship on its own.

---

## Quick wins (≤ half a day each, no schema change)

### Q1. Show bottle thumbnails on the bottles list
`app/bottles/page.tsx` already fetches `bottle.imageUrl`, and you've wired up the whole Cloudinary pipeline — but the list view is still text-only. Add a small `<Image>` using `getThumbnailUrl(bottle.imageUrl)` from `lib/cloudinary.ts`. Huge perceived-polish win for ~20 lines of JSX.

### Q2. Sort controls on the bottles list
Right now bottles are implicitly sorted by the API's default order. Add a Mantine `<Select>` with: "Recently added", "Purchase date", "Highest rated", "Most expensive", "Oldest vintage", "Name A–Z". Purely client-side sort of the already-loaded list.

### Q3. CSV export
`GET /api/bottles/export` → returns a CSV of the user's bottles with flattened wine/spirit attributes. One route, Node's built-in serialisation, no deps. Drop a "Export CSV" button on `/bottles`. Great disaster-recovery story and converts spreadsheet-users easily.

### Q4. Collapse redundant `StashType` enum values
`REFRIGERATOR` and `FRIDGE` are the same concept. Keep both in the enum (non-destructive), but update the create-stash UI to only offer one — and quietly normalise on read.

---

## Data-depth features

### D1. Tasting entries — log multiple tastings per bottle
Great for whiskies you open and sip over months, or bottles you share at parties.

**New table** (additive, no existing data touched):
```prisma
model TastingEntry {
  id         String   @id @default(cuid())
  bottleId   String
  bottle     Bottle   @relation(fields: [bottleId], references: [id], onDelete: Cascade)
  tastedAt   DateTime @default(now())
  nose       String?  @db.Text
  palate     String?  @db.Text
  finish     String?  @db.Text
  rating     Int?     // 0–100 so it's forward-compatible with Parker/WA scales
  context    String?  // "with Mike", "Thanksgiving", etc.
  createdAt  DateTime @default(now())

  @@index([bottleId, tastedAt])
}
```

- `bottle.notes` stays as-is for backward compat.
- Bottle detail page gets a "Tasting Log" tab — timeline view.
- Adds `GET/POST /api/bottles/[id]/tastings` and `DELETE /api/tastings/[id]`.

### D2. Pour log — consumption events over time
Replaces the binary `finished` with a real history.

**New table**:
```prisma
model PourEvent {
  id         String   @id @default(cuid())
  bottleId   String
  bottle     Bottle   @relation(fields: [bottleId], references: [id], onDelete: Cascade)
  pouredAt   DateTime @default(now())
  amountMl   Float
  occasion   String?
  createdAt  DateTime @default(now())

  @@index([bottleId, pouredAt])
}
```

- `bottle.amountRemaining` becomes **derived** (`size - SUM(pours)`) instead of stored — or you keep it for speed and recalculate on each pour-event write. I'd recommend a DB trigger or a small helper that re-computes on write; simpler than invalidation.
- `bottle.finished` stays, but gets auto-set when `amountRemaining <= 0`.
- Enables a "last poured" widget and a consumption-pace chart.

### D3. Drink windows for wine
Two nullable columns on `WineProduct`:
```prisma
drinkFrom  Int?  // year
drinkTo    Int?  // year
```
Dashboard gets a "Entering their window in {currentYear}" widget — one-query win off a `WineProduct.drinkFrom <= year <= drinkTo` filter. Optional fields, zero migration risk.

### D4. Structured beer support
You have `BEER` in `BrandType` but no `BeerProduct` table — so beer brands can only use the generic fields. Fix with a parallel table:
```prisma
model BeerProduct {
  id          String   @id @default(cuid())
  productId   String   @unique
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  style       String?  // IPA, Stout, Pilsner...
  abv         Float?
  ibu         Int?
  brewery     String?
  hops        String?
  malts       String?
}
```
Matches the shape of `WineProduct`/`SpiritProduct`. Only activates if the user picks a beer brand.

---

## Organization & UX

### O1. Free-form tags on bottles
Cross-cutting categories that don't fit the Stash→Shelf hierarchy ("gifts", "special-occasion", "share-worthy", "cellared-blind").

```prisma
model Tag {
  id       String   @id @default(cuid())
  name     String
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  bottles  BottleTag[]
  createdAt DateTime @default(now())

  @@unique([userId, name])
}

model BottleTag {
  bottleId String
  tagId    String
  bottle   Bottle @relation(fields: [bottleId], references: [id], onDelete: Cascade)
  tag      Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([bottleId, tagId])
  @@index([tagId])
}
```

Tags are user-scoped so they never leak across accounts. Adds `/tags/[name]` as a filtered list view.

### O2. Barcode scan path (faster than OCR)
Your `Product.barcode` column already exists — just nothing reads it.

1. New client route `/bottles/scan-barcode` using `@zxing/browser` (WASM, no server round-trip for the decode).
2. `GET /api/products/by-barcode/[upc]` → returns matching product if any; else a "create new" prompt with the UPC pre-filled.
3. Optional integration: Open Food Facts or Vivino-style UPC lookup for first-time UPCs to auto-populate name/brand.
4. The existing OCR flow stays as a fallback for bottles without a scannable barcode (e.g. old wines).

Faster, higher accuracy, less Google Vision spend.

### O3. Decompose the 1,173-line scan page
`app/bottles/scan/page.tsx` juggles 7 state machines in one file — capture, process, match, new-product, upload, bottle-details, submit. Split into:
```
app/bottles/scan/
  page.tsx                    # orchestrator, state reducer
  _components/CaptureStep.tsx
  _components/MatchResults.tsx
  _components/CreateProductStep.tsx
  _components/BottleDetailsStep.tsx
```
Same behaviour, testable slices, much faster iteration when you want to tune the OCR matching. No schema or API changes.

---

## Analytics & recommendations

### A1. Collection value over time
Derive monthly snapshots purely from `purchaseDate` + `purchasePrice` — no new table needed. One aggregated query, line chart on the dashboard. Cheap and high-impact.

### A2. "Similar to what you've loved" recommendations
For each of a user's top-5-rated products, find other products that share varietal/region/style (wine) or distillery/style/age (spirit). Surface the top 3 hits the user doesn't already own as a "Try next" strip on the dashboard.

Two queries:
1. `prisma.bottle.findMany({ where: { userId, rating: { gte: 8 } }, orderBy: { rating: 'desc' }, take: 5, include: { product: { include: { wineData: true, spiritData: true } } } })`
2. For each seed product, find peers matching its attribute profile, excluding ones the user already owns.

No ML, no embeddings — the schema already encodes the right signals.

### A3. Consumption trend view
Off D2's `PourEvent`. Weekly/monthly pour volume, top-3 bottles by pour count. Gives a "your drinking rhythm" view without being judgemental about it.

---

## Sharing & multi-user

### S1. Read-only public share links for a stash
Opt-in per stash. Lets a user show a friend "here's my bar" without making the whole account public.

```prisma
model StashShare {
  id         String   @id @default(cuid())
  stashId    String   @unique
  stash      Stash    @relation(fields: [stashId], references: [id], onDelete: Cascade)
  token      String   @unique  // 32-char random, unguessable
  createdAt  DateTime @default(now())
  expiresAt  DateTime?
  revoked    Boolean  @default(false)
}
```

Route `/s/[token]` renders a read-only stash view. No auth required. The user can revoke any time.

### S2. Household accounts
For partners who share a cellar. `HouseholdMembership` table linking multiple users to a shared namespace for Stashes/Bottles. This is bigger and has real implications (who owns a bottle record? what happens on divorce?) — call it out as "design-only" until you've lived with tagging (O1) and shares (S1) and seen whether you actually need full co-ownership.

---

## Platform hygiene

### P1. Composite indexes (additive, index-only migration)
A few common query shapes lack composite indexes. Since indexes are additive and non-destructive, they're safe to add to production:
```prisma
@@index([userId, finished])       // Bottle — drives list filtering
@@index([userId, productId])      // Bottle — drives inventory aggregation
@@index([shelfId, order])         // ShelfItem — drives shelf ordering
```
I'd add these to `schema.prisma`, run `prisma migrate dev --create-only`, and show you the SQL before anything touches prod.

### P2. Light rate-limiting on mutating routes
No dependency needed — a 60-request-per-minute in-memory token bucket keyed by `session.user.id` covers 99% of the abuse surface for a personal app. Swap to Upstash/Redis later if you go multi-tenant.

### P3. NextAuth v4 → v5 upgrade
Not urgent but on the horizon. v5 has breaking changes in the adapter + the callback shape. Good candidate for a dedicated branch with its own PR.

### P5. Reconcile auth drift: NextAuth (local) vs Stack Auth / Neon Auth (prod)
`.env` local uses `NEXTAUTH_SECRET` + Google OAuth via `@next-auth/prisma-adapter`. Prod has `STACK_SECRET_SERVER_KEY`, `STACK_PROJECT_ID`, and a `neon_auth.users_sync` table — i.e. prod is wired for Stack Auth / Neon Auth, not NextAuth. This is a real problem: any auth-adjacent code path tested locally runs against a different identity system than prod, so sign-in/out, session shape, and `session.user.id` can diverge silently.

**Decision you need to make** (not something I can pick for you):
- **Keep NextAuth.** Remove the Stack/Neon Auth env vars from prod, stop whatever is syncing into `neon_auth.users_sync`, and ensure the `User` model remains the source of truth.
- **Switch to Stack Auth / Neon Auth.** Replace `lib/auth.ts` + `getServerSession` calls (~14 files use it) with Stack's equivalents, wire the `users_sync` rows into your app's `User` model or replace references, and delete NextAuth deps.
- **Dual-stack indefinitely.** Viable only if you build a thin abstraction over `getServerSession` that picks the right backend per environment — more code, more risk, not recommended.

Either of the first two is a dedicated branch. The drift was invisible until we pulled prod env vars during the backup work.

### P4. Move dashboard page to a Server Component that streams
The dashboard is already a Server Component, but it blocks on `getUserStats()` before rendering. Wrap each card in `<Suspense>` with a skeleton and split the lib into sub-functions so fast numbers (totals) paint before slow ones (raw SQL groupBys). Next.js 16 handles this cleanly.

---

## Suggested first slice

If I were picking the next 2–3 things to actually build, I'd pick:

1. **D1 Tasting entries** — gives the app real long-term value and leans into the personal-journal angle.
2. **O2 Barcode scan** — dramatically speeds up the most common flow (adding a bottle).
3. **Q1 thumbnails + Q2 sort + Q3 CSV export** — three small wins, one afternoon of work, dramatic UX lift.

The bigger items (D2 pour log, S1 share links, O1 tags) are all good — but each is a multi-session effort and benefits from living with the quick wins first to see which usage patterns emerge.
