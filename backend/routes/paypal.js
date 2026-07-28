/**
 * routes/paypal.js
 * ------------------------------------------------------------------
 * Creates and captures a PayPal order using the PayPal Checkout
 * Server SDK. Pair this with the PayPal JS SDK buttons on the
 * front end (see checkout.html comments for the swap-in points).
 * ------------------------------------------------------------------
 */

const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const db = require('../db/database');
const { sendOrderConfirmation, sendAdminNotification } = require('../email/sendEmail');

const router = express.Router();

function paypalClient() {
  const Environment = process.env.PAYPAL_MODE === 'live'
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment;

  const environment = new Environment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
  return new paypal.core.PayPalHttpClient(environment);
}

// POST /api/paypal/create-order   Body: { orderId }
router.post('/create-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await db.getOrder(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order.id,
          description: `Noteplay AI Music — ${order.plan} plan for ${order.song_for}`,
          amount: { currency_code: 'USD', value: order.price.toFixed(2) }
        }
      ],
      application_context: {
        return_url: `${process.env.CLIENT_URL}/success.html?order=${order.id}`,
        cancel_url: `${process.env.CLIENT_URL}/checkout.html?order=${order.id}`
      }
    });

    const response = await paypalClient().execute(request);
    res.json({ id: response.result.id });
  } catch (err) {
    console.error('PayPal order creation failed:', err);
    res.status(500).json({ error: 'Could not start PayPal checkout.' });
  }
});

// POST /api/paypal/capture-order   Body: { paypalOrderId, orderId }
router.post('/capture-order', async (req, res) => {
  try {
    const { paypalOrderId, orderId } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});
    const capture = await paypalClient().execute(request);

    if (capture.result.status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Payment not completed.' });
    }

    await db.markOrderPaid(orderId, 'paypal', capture.result.id);
    const order = await db.getOrder(orderId);
    const orderForEmail = {
      id: order.id, fullName: order.full_name, email: order.email,
      songFor: order.song_for, plan: order.plan, style: order.style,
      mood: order.mood, price: order.price, occasion: order.occasion,
      length: order.length, lyrics: order.lyrics, details: order.details,
      commercialUse: !!order.commercial_use,
      referenceFilePath: order.reference_file_path,
      paymentMethod: order.payment_method, paymentReference: order.payment_reference
    };
    await sendOrderConfirmation(orderForEmail);
    await sendAdminNotification(orderForEmail);

    res.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error('PayPal capture failed:', err);
    res.status(500).json({ error: 'Could not capture PayPal payment.' });
  }
});

module.exports = router;
