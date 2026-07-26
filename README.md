# Ledger — Family Money Tracker

A private multi-profile money tracker: separate wallets per person, cash
denomination breakdowns, and two-way debt tracking (money you owe / money
owed to you) with partial payments.

## What's inside
- `src/` — React frontend (Vite)
- `netlify/functions/` — the backend API (Netlify Functions, talk to Postgres)
- `db/schema.sql` — the database schema to run once on your database

## 1. Create the site on Netlify
1. Push this folder to a GitHub repo (or drag-and-drop deploy via Netlify's UI).
2. In Netlify: **Add new site → Import an existing project**, connect the repo.
3. Build settings are already set via `netlify.toml` (build command `npm run build`,
   publish directory `dist`, functions directory `netlify/functions`) — you
   shouldn't need to change anything.

## 2. The database sets itself up — no manual SQL step needed
This project uses **Netlify Database (GA)**, not the older Neon-extension beta.
That means:
- Because `@netlify/database` is listed as a dependency (already done in
  `package.json`), Netlify automatically provisions a Postgres database the
  first time you deploy — nothing to click or enable manually.
- The schema lives at `netlify/database/migrations/0001_initial_schema/migration.sql`.
  Netlify detects this folder and applies it automatically as part of every
  deploy (production and previews each get it applied once).
- You do **not** need to open any SQL console and paste anything in — that
  console in the Netlify dashboard is read-only by design in the new system;
  schema changes are meant to travel through committed migration files like
  this one, not ad-hoc queries against production.

Just push your code (including the `netlify/database/migrations` folder) and
deploy — the database and its tables will exist by the time the deploy
finishes.

## 3. Deploy
Trigger a deploy (pushing to your repo does this automatically, or use
**Deploys → Trigger deploy** in the Netlify dashboard). Netlify will:
- Provision the database (first deploy only) and apply the migration above
- Run `npm install` and `npm run build` for the frontend
- Bundle everything in `netlify/functions/` as serverless API endpoints
- Serve the API at `/api/*` (see `netlify.toml` redirects)

## 4. Local development (optional)
```bash
npm install
npm install -g netlify-cli   # if you don't have it
netlify link                 # connect to your Netlify site
netlify dev                  # runs Vite + functions against a local Postgres
```
`netlify database migrations apply` applies pending migrations to your local
dev database if it's ever out of sync.

## How it's organized

**Profiles & login** — Each sibling picks their name from a tile grid and
enters their PIN. PINs are hashed (bcrypt) before being stored. This is
intentionally casual security — just enough to keep siblings out of each
other's data, not bank-grade.

**Wallets** — Each profile creates unlimited custom wallets ("Money with Mom",
"Pocket cash", "Redotpay") each pinned to one currency (DA / USD / EUR / USDT).
Balances are calculated live from transaction history, not stored directly.

**Deposits & withdrawals** — Amount and date are the only required fields.
Reason, source/target, and (for DA wallets only) a cash denomination
breakdown are optional. The denomination picker validates that your bill
counts add up to the total.

**Debts** — Two independent tabs:
- *I owe*: logged directly (no wallet is touched until you actually pay).
  Paying it down creates a real withdrawal transaction from whichever wallet
  you paid from.
- *Owed to me*: created from a wallet's "Take money out" form by checking
  "this is a loan" — this immediately withdraws from that wallet **and**
  creates the debt entry, linked together. When they pay you back, it
  creates a real deposit into whichever wallet you choose.

Both support partial payments with a running balance and progress bar, and
show an overdue/due-soon badge based on the timeline you set (specific date /
soon / unsure / later).

**History** — A combined, filterable activity feed across every wallet, in
addition to each wallet's own transaction list. All entries are freely
editable/deletable (except entries linked to a debt — delete the debt instead,
which removes its linked transactions too).

**Currencies** — Kept fully separate everywhere. There is no combined
"net worth" number — DA, USD, EUR, and USDT are always shown and calculated
independently.

## Extending it later
- The `transactions.js` function already supports `PUT /api/transactions/:id`
  for edits — there's just no edit button wired up in the UI yet if you want
  to add one.
- To add more currencies, extend the `currency_type` enum in the schema and
  the `CURRENCIES` array in `NewWalletModal.jsx`, `NewDebtModal.jsx`, and
  `wallets.js`/`debts.js`.
- PIN security can be upgraded later to real email/password accounts without
  changing the data model much — just swap out `login.js`/`profiles.js`.
