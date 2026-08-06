/**
 * routes/orders.js
 * ------------------------------------------------------------------
 * Receives order form submissions (with optional reference-audio
 * upload), persists them, and returns an orderId used later by the
 * Stripe / PayPal routes to create a checkout session.
 * ------------------------------------------------------------------
 */

const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const db = require('../db/database');

const router = express.Router();

const PLAN_PRICES = { basic: 9.99, premium: 14.99, commercial: 24.99 };

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many orders submitted from this device. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

function requireAdminKey(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_API_KEY) {
    return res.status(500).json({ error: 'Admin access is not configured on this server.' });
  }
  if (key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) cb(null, true);
    else cb(new Error('Only audio files are allowed for the reference upload.'));
  }
});

router.post('/', orderLimiter, upload.single('refAudio'), async (req, res) => {
  try {
    const body = req.body;
    const required = ['fullName', 'email', 'songFor', 'occasion', 'style', 'mood', 'length', 'plan'];
    const normalizedBody = {};
    for (const field of required) {
      if (typeof body[field] !== 'string' || !body[field].trim()) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
      normalizedBody[field] = body[field].trim();
    }
    normalizedBody.lyrics = typeof body.lyrics === 'string' ? body.lyrics : '';
    normalizedBody.details = typeof body.details === 'string' ? body.details : '';

    const plan = normalizedBody.plan;
    if (!PLAN_PRICES[plan]) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }
    const commercialUse = body.commercialUse === 'true' || body.commercialUse === true;
    if (commercialUse && plan !== 'commercial') {
      return res.status(400).json({ error: 'Commercial use requires the Commercial License plan.' });
    }
    const order = {
  id: 'NOTE-' + uuidv4().split('-')[0].toUpperCase(),
  fullName: normalizedBody.fullName,
  email: normalizedBody.email,
  songFor: normalizedBody.songFor,
  occasion: normalizedBody.occasion,
  style: normalizedBody.style,
  mood: normalizedBody.mood,
  length: normalizedBody.length,
  lyrics: normalizedBody.lyrics,
  details: normalizedBody.details,
  commercialUse,
  plan,
  price: PLAN_PRICES[plan],
  referenceFilePath: req.file ? req.file.path : null
};
    await db.createOrder(order);
    res.status(201).json({ orderId: order.id, price: order.price });
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ error: 'Could not create order. Please try again.' });
  }
});

router.get('/:id', requireAdminKey, async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch order.' });
  }
});

router.get('/', requireAdminKey, async (req, res) => {
  try {
    const orders = await db.listOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Could not list orders.' });
  }
});

module.exports = router;
