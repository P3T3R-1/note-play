/**
 * server.js
 * ------------------------------------------------------------------
 * Noteplay — example backend (Node.js / Express)
 *
 * Run locally:
 *   cp .env.example .env   # then fill in real test keys
 *   npm install
 *   npm run dev
 *
 * Endpoints:
 *   POST /api/orders                       create an order (multipart form)
 *   GET  /api/orders/:id                    fetch one order
 *   GET  /api/orders                        list orders (admin)
 *   POST /api/create-checkout-session       start a Stripe Checkout session
 *   POST /api/stripe/webhook                Stripe payment webhook
 *   POST /api/paypal/create-order           start a PayPal order
 *   POST /api/paypal/capture-order          capture a PayPal payment
 * ------------------------------------------------------------------
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const ordersRouter = require('./routes/orders');
const stripeRouter = require('./routes/stripe');
const paypalRouter = require('./routes/paypal');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

// IMPORTANT: the Stripe webhook route needs the raw request body, so it
// is mounted BEFORE the global express.json() body parser.
app.use('/api/stripe', stripeRouter);

app.use(express.json());

app.use('/api/orders', ordersRouter);
app.use('/api', stripeRouter);   // exposes /api/create-checkout-session
app.use('/api/paypal', paypalRouter);

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'noteplay-backend' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Noteplay backend running on http://localhost:${PORT}`));
