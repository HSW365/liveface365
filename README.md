# LiveFace365 — HSW365 Creator Studio

LiveFace365 is a creator studio for local camera preview, visual looks, capture, account access, and subscription management.

## Current frontend

- React + Vite responsive studio UI.
- Browser camera preview with permission/error handling and camera shutdown.
- Six selectable real-time color treatments with adjustable intensity.
- PNG snapshot capture and local WebM recording of the processed preview.
- Mirror preview, mobile navigation, and OBS setup guidance.
- Account and subscription UI connected to the API when `VITE_API_BASE_URL` is configured.

**Important:** Current visual looks are color treatments, not AI face replacement. Direct streaming output and a production face/character engine require a separate integration.

## API service

The `server/` directory contains an Express API with:
- PostgreSQL user and subscription records.
- Password hashing, short-lived session tokens, rate limiting, and protected account routes.
- Stripe-hosted subscription Checkout and Customer Portal endpoints.
- Stripe webhook signature verification and subscription status updates.
- Health/status endpoints at `/health` and `/api/status`.

The API does not grant paid entitlements based on browser redirects. It reads subscription state updated from verified Stripe webhook events.

## Deploy API on Render

A Render Blueprint is included in `render.yaml`. It creates the API web service. A PostgreSQL database must be provisioned and its connection string set as `DATABASE_URL`. Review the plan and any costs in Render before applying.

Required configuration:
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: strong random secret; Render can generate one.
- `FRONTEND_URL`: deployed frontend URL.
- `FRONTEND_ORIGINS`: comma-separated allowed browser origins.
- `STRIPE_SECRET_KEY`: Stripe secret key for the selected account and mode.
- `STRIPE_WEBHOOK_SECRET`: signing secret for the API webhook endpoint `/api/billing/webhook`.
- `STRIPE_CREATOR_PRICE_ID`: recurring monthly Stripe Price ID for Creator Pro.
- `STRIPE_STUDIO_PRICE_ID`: recurring monthly Stripe Price ID for Studio Pro.
- `FACE_ENGINE_URL` and `FACE_ENGINE_API_KEY`: only after choosing a real face/character rendering provider.

Create a GitHub Actions repository variable named `VITE_API_BASE_URL` with the deployed API's HTTPS origin, then rerun the Pages workflow. Do not put Stripe secrets in GitHub Pages variables or frontend code.

## Local development

Requires Node.js 20.19+.

Frontend:
```bash
npm install
npm run dev
```

API:
```bash
cd server
npm install
DATABASE_URL=postgres://... JWT_SECRET=replace-with-a-long-random-secret npm start
```

## Before accepting real customers

This is an implementation foundation, not a claim that all production integrations are configured. Before public launch:
1. Configure email verification, password recovery, and account deletion.
2. Provision and test PostgreSQL backups/retention.
3. Create the subscription prices in the correct Stripe account and configure the customer portal, webhook, tax settings, and cancellation behavior.
4. Run Stripe test-mode checkout and webhook tests before switching to live mode.
5. Select and license a real face/character engine; verify consent, likeness rights, latency, and data retention.
6. Implement a supported streaming output path and test it on the target platforms.
7. Add automated API tests, monitoring, abuse controls, and security review.

Never commit provider secrets, Stripe keys, or streaming keys to Git. Use your own likeness, licensed likenesses, or fictional characters and follow applicable platform disclosure rules.
