/**
 * routes/stripe.js
 * ------------------------------------------------------------------
 * Creates a Stripe Checkout Session for a given order, and handles
 * the webhook Stripe calls once payment succeeds.
 * ------------------------------------------------------------------
 */

const express = require('express');
const Stripe = require('stripe');
const db = require('../db/database');
const { sendOrderConfirmation } = require('../email/sendEmail');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/create-checkout-session
// Body: { orderId }
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await db.getOrder(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Noteplay AI Music — ${order.plan} plan`,
              description: `Custom song for: ${order.song_for}`
            },
            unit_amount: Math.round(order.price * 100) // cents
          },
          quantity: 1
        }
      ],
      metadata: { orderId: order.id },
      customer_email: order.email,
      success_url: `${process.env.CLIENT_URL}/success.html?order=${order.id}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout.html?order=${order.id}`
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Stripe session creation failed:', err);
    res.status(500).json({ error: 'Could not start Stripe checkout.' });
  }
});

// POST /api/stripe/webhook
// Stripe calls this endpoint directly — must use the raw body parser (see server.js)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    try {
      await db.markOrderPaid(orderId, 'stripe', session.payment_intent);
      const order = await db.getOrder(orderId);
      await sendOrderConfirmation({
        id: order.id, fullName: order.full_name, email: order.email,
        songFor: order.song_for, plan: order.plan, style: order.style,
        mood: order.mood, price: order.price
      });
    } catch (err) {
      console.error('Failed to finalize paid order:', err);
    }
  }

  res.json({ received: true });
});

module.exports = router;
