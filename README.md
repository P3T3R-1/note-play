# Noteplay

A complete, responsive website for selling custom AI-generated music tracks — static HTML/CSS/JS front end, plus an example Node/Express backend for orders, Stripe, PayPal and email.

## File structure

```
noteplay/
├── index.html              Homepage (hero, pricing, features, testimonials, FAQ)
├── order.html               Order form
├── checkout.html            Stripe + PayPal checkout
├── success.html              Post-payment confirmation
├── terms.html                Terms of Service
├── privacy.html              Privacy Policy
├── contact.html               Contact page
├── css/
│   └── style.css            All site styling (design tokens at the top)
├── js/
│   ├── main.js               Shared behaviour: nav, waveform, FAQ, cookie banner
│   ├── order.js               Order form logic + live price summary
│   └── checkout.js            Checkout tab switching + mock payment handoff
└── backend/                  Example Node.js/Express API (not required for the
                               static site to run — see below)
    ├── server.js
    ├── package.json
    ├── .env.example
    ├── routes/
    │   ├── orders.js          Order intake + file upload + SQLite storage
    │   ├── stripe.js           Stripe Checkout session + webhook
    │   └── paypal.js            PayPal order create/capture
    ├── db/
    │   └── database.js         SQLite setup (MongoDB alternative documented inline)
    └── email/
        └── sendEmail.js         Order confirmation + delivery emails (nodemailer)
```

## Running the front end locally

The site is plain HTML/CSS/JS — no build step required.

```bash
cd noteplay
python3 -m http.server 3000
# visit http://localhost:3000
```

The order → checkout → success flow currently uses `sessionStorage` to pass
order data between pages, and simulates payment with a short delay. This lets
you demo the full flow without a backend running. To go live, replace the
`fetch()` placeholders in `js/checkout.js` with real calls to the backend
endpoints described below.

## Running the backend locally

```bash
cd backend
cp .env.example .env      # fill in your Stripe/PayPal test keys + SMTP creds
npm install
npm run dev                # starts on http://localhost:4000
```

Then point `order.html`'s form submit and `checkout.js` at your backend, e.g.:

```js
await fetch('http://localhost:4000/api/orders', { method: 'POST', body: formData });
await fetch('http://localhost:4000/api/create-checkout-session', { ... });
```

### Stripe test mode
1. Create a free Stripe account and grab your **test** keys from the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys).
2. Add them to `.env` as `STRIPE_SECRET_KEY`.
3. Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks locally: `stripe listen --forward-to localhost:4000/api/stripe/webhook`.
4. Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

### PayPal sandbox
1. Create a [PayPal Developer](https://developer.paypal.com) account and a sandbox app to get a Client ID/Secret.
2. Add them to `.env` as `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`, keep `PAYPAL_MODE=sandbox`.
3. Use a sandbox buyer account to test the full approve/capture flow.

### Email
Any SMTP provider works (SendGrid, Postmark, Mailgun, or Gmail with an app password). Fill in the `SMTP_*` values in `.env`.

### Database
Ships with SQLite for zero-config local storage (`backend/db/noteplay.sqlite` is created automatically). A MongoDB equivalent is documented in comments inside `backend/db/database.js` — swap the exported functions and nothing else in the app needs to change.

## Deploying

### Front end — Vercel or Netlify (static)
1. Push this folder to a GitHub repo.
2. **Vercel:** import the repo, framework preset "Other", no build command, output directory `/` (or the `noteplay` folder if nested). Deploy.
3. **Netlify:** "Add new site → Import an existing project", build command: *(none)*, publish directory: `noteplay`. Deploy.
4. Add your custom domain in the host's dashboard once deployed.

### Backend — Render, Railway, Fly.io, or a Vercel/Netlify serverless function
The example backend is a standard Express app, so it deploys as-is to Render, Railway or Fly.io (`npm start`). To run it as serverless functions on Vercel/Netlify instead, move each router's logic into individual files under `/api` (Vercel) or `/netlify/functions` (Netlify) — the request-handling logic in `routes/*.js` can be reused almost unchanged.

Remember to:
- Set all `.env` values as environment variables in your host's dashboard (never commit `.env`).
- Point the front end's `fetch()` calls at your deployed backend URL.
- Update `CLIENT_URL` in the backend's environment variables to your deployed front-end URL, so Stripe/PayPal redirects land correctly.
- Switch Stripe/PayPal from test/sandbox keys to live keys only after end-to-end testing.

## Customizing

- **Business details** — update the footer, `contact.html`, and email templates in `backend/email/sendEmail.js`.
- **Pricing** — edit the `.price-card` blocks in `index.html`, the `data-price` attributes in `order.html`, and `PLAN_PRICES` in `backend/routes/orders.js` (keep all three in sync).
- **Colors/fonts** — all design tokens live at the top of `css/style.css`.
