# HLBR Store Del

Rider-facing delivery panel for HLBR Store. Deploys separately from the storefront (`HLBRStore`) and the coordinator panel (`HLBRStoreCoord`), intended for `del.hlbrstore.com`.

## What this is

A deliberately tiny Next.js app. Riders see the orders that are **out for delivery** (status `dispatched`) and can mark one **delivered** only by entering the passcode the customer gives them at the door. It also has a read-only "Delivered" tab. It never touches products or the customer `hlbr_store_users` table, and it can't set any status other than `delivered`.

Setup, stack, and Amplify steps follow `../NEW-SATELLITE-APP-PLAYBOOK.md`; this app is the same shape as `HLBRStoreCoord`.

## Who sees which order

A coordinator picks the delivery executive when dispatching an order (in `HLBRStoreCoord`), which sets `assignedTo` on the order. Each executive then sees only their own work (`src/lib/visibility.ts`):

- **Out for delivery:** dispatched orders assigned to them.
- **Delivered:** orders they delivered.
- `POST /api/orders/[id]/deliver` rejects anyone else with a 403 **before** spending a passcode attempt, so nobody can guess (or lock) another executive's order. This is enforced on the server, not just hidden in the UI.
- Orders dispatched **before** assignment existed have no `assignedTo`. They stay visible to every executive, marked "Not assigned to anyone yet", so they can still be delivered. Once the backlog clears this is a no-op.
- To hand an order to someone else, the coordinator dispatches it again with a different executive.

## Delivery passcode flow

1. The customer sees a passcode for their order on hlbrstore.com.
2. The rider arrives, collects the cash (`orderTotal` is shown on the card), and asks for the passcode.
3. The rider types it into the card and taps **Confirm Delivery** → `POST /api/orders/[id]/deliver`.
4. The server compares it (constant-time) with `deliveryPasscode` on the order. On a match the order becomes `delivered` and `deliveredAt` / `deliveredBy` are recorded.

Security properties:
- The passcode **never leaves the server**: it's stripped from every order sent to the browser (`toRiderOrder` in `src/lib/db/orders.ts`).
- A short numeric code is trivially brute-forceable, so every submission (right or wrong) spends one of `MAX_PASSCODE_ATTEMPTS` (5) tracked in `passcodeAttempts` on the order, using an atomic conditional `ADD`. After that the API returns 429 and the order can't be delivered from this app.
- Delivery is a conditional update (`status = dispatched`), so double submits and races can't deliver twice.

### Storefront side (in `HLBRStore`)
`placeOrder` in `HLBRStore/src/lib/db/orders.ts` generates `deliveryPasscode` (`PASSCODE_LENGTH` digits, `crypto.randomInt`, see `src/lib/passcode.ts`) and saves it on the order. The customer sees it on their order detail page (`/orders/[orderId]`) while the order is active; it's never shown to anyone else. Keep `DELIVERY_PASSCODE_LENGTH` (storefront) and `PASSCODE_LENGTH` (this app) equal.

Orders placed before that change have no passcode; riders see "This order has no delivery passcode. Contact the coordinator." for those.

### Unlocking a locked order
There's no UI for this yet. To reset an order stuck at 5 attempts, set `passcodeAttempts` back to `0` (or remove it) in the DynamoDB console. Coordinators can also mark it delivered from `HLBRStoreCoord`.

## Auth

Riders log in with **Employee ID + password** (e.g. `HLBR-STORE-DEL-1`), same model as the coordinator app. 12-hour JWT in the `hlbr_del_session` cookie. No self-signup; accounts are provisioned by hand.

Every page and API route calls `getCurrentRider()` (`src/lib/auth/rider.ts`), which verifies the JWT **and** that the rider still exists in the table — `src/proxy.ts` alone only checks that a cookie is present and is not a security boundary.

## Local setup

1. `npm install`
2. `.env.local` (gitignored) is set up with `DEV_MODE=true`: the app runs fully in-memory, seeded with
   - Executive `HLBR-STORE-DEL-1` and `HLBR-STORE-DEL-2` (a second one, to test assignment), both with password `pass@1234`
   - Dispatched orders: `4821` (assigned to DEL-1), `1357` (assigned to DEL-2), `7777` (unassigned, like an order from before assignment existed); two delivered orders; and one packed order (which must not appear)
3. `npm run dev` → http://localhost:3000 (redirects to `/login`)

## Provisioning a real rider

1. Hash locally: `node -e "console.log(require('bcryptjs').hashSync('their-password', 10))"`
2. Add an item to `hlbr_store_del_executives` in the DynamoDB console:
   ```json
   {
     "employeeId": "HLBR-STORE-DEL-1",
     "passwordHash": "<hash from step 1>",
     "name": "Rider's name",
     "createdAt": "2026-09-25T00:00:00.000Z"
   }
   ```

## Data model

- `hlbr_store_orders` — shared with the storefront, PK `orderId`. This app reads (paginated, status-filtered `Scan`) and writes only `status` (dispatched → delivered), `deliveredAt`, `deliveredBy`, and `passcodeAttempts`. It reads `assignedTo`, which `HLBRStoreCoord` writes.
- `hlbr_store_del_executives` — PK `employeeId`, owned by this app. Create it manually (on-demand capacity, deletion protection on).

## Deploying to AWS Amplify

Follow the playbook. App-specific bits:
- Env vars: `SESSION_SECRET` (**freshly generated**, not shared with the other apps), `DYNAMODB_ORDERS_TABLE`, `DYNAMODB_DEL_EXECUTIVES_TABLE`, `DEV_MODE=false`, `NEXT_PUBLIC_DEV_MODE=false`. Never `AWS_REGION`.
- Its own **SSR compute role** (e.g. `HlbrDelSSRComputeRole`), least privilege:
  - `hlbr_store_orders`: `dynamodb:Scan`, `dynamodb:GetItem`, `dynamodb:UpdateItem`
  - `hlbr_store_del_executives`: `dynamodb:GetItem`
- Custom domain `del.hlbrstore.com` only after verifying on the default `amplifyapp.com` URL.
