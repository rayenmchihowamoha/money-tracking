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

## 2. Add the database (Netlify DB)
1. In your new site's dashboard: **Extensions → Netlify DB** → enable it.
   This provisions a free Neon Postgres database and automatically sets the
   `NETLIFY_DATABASE_URL` environment variable for your functions — you don't
   need to copy/paste any connection string yourself.
2. Open the database's SQL editor (Netlify DB gives you a link to the Neon
   console, or use any Postgres client with the connection string shown in
   **Site settings → Environment variables**).
3. Run the entire contents of `db/schema.sql` once. This creates all the
   tables (profiles, wallets, transactions, debts, debt_payments, sessions).

## 3. Deploy
Trigger a deploy (pushing to your repo does this automatically). Netlify will:
- Run `npm install` and `npm run build` for the frontend
- Bundle everything in `netlify/functions/` as serverless API endpoints
- Serve the API at `/api/*` (see `netlify.toml` redirects)

## 4. Local development (optional)
```bash
npm install
npm install -g netlify-cli   # if you don't have it
netlify link                # connect to your Netlify site
netlify dev                 # runs Vite + functions together with the DB env vars
```
`netlify dev` pulls in your real `NETLIFY_DATABASE_URL` so you're working
against the same database as production — be a little careful testing
destructive actions.

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
