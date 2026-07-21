/**
 * db/database.js
 * ------------------------------------------------------------------
 * SQLite storage for orders (simple, file-based — good for a small
 * shop or a starting point). Swap in the commented MongoDB block
 * below if you'd rather use Mongo/Atlas — the rest of the app only
 * calls the exported functions, so either backend works unchanged.
 * ------------------------------------------------------------------
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'noteplay.sqlite');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      song_for TEXT NOT NULL,
      occasion TEXT,
      style TEXT,
      mood TEXT,
      length TEXT,
      lyrics TEXT,
      details TEXT,
      commercial_use INTEGER DEFAULT 0,
      plan TEXT NOT NULL,
      price REAL NOT NULL,
      reference_file_path TEXT,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'pending',
      payment_reference TEXT,
      status TEXT DEFAULT 'received',
      created_at TEXT NOT NULL
    )
  `);
});

function createOrder(order) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO orders (
        id, full_name, email, song_for, occasion, style, mood, length,
        lyrics, details, commercial_use, plan, price, reference_file_path,
        payment_method, payment_status, status, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;
    const params = [
      order.id, order.fullName, order.email, order.songFor, order.occasion,
      order.style, order.mood, order.length, order.lyrics, order.details,
      order.commercialUse ? 1 : 0, order.plan, order.price,
      order.referenceFilePath || null, order.paymentMethod || null,
      'pending', 'received', new Date().toISOString()
    ];
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(order.id);
    });
  });
}

function markOrderPaid(orderId, paymentMethod, paymentReference) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE orders SET payment_status = 'paid', payment_method = ?, payment_reference = ?, status = 'in_production' WHERE id = ?`,
      [paymentMethod, paymentReference, orderId],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      }
    );
  });
}

function getOrder(orderId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM orders WHERE id = ?`, [orderId], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function listOrders() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM orders ORDER BY created_at DESC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = { db, createOrder, markOrderPaid, getOrder, listOrders };

/**
 * ------------------------------------------------------------------
 * MongoDB alternative (swap-in)
 * ------------------------------------------------------------------
 * const { MongoClient } = require('mongodb');
 * const client = new MongoClient(process.env.MONGODB_URI);
 * let ordersCollection;
 *
 * async function connect() {
 *   await client.connect();
 *   ordersCollection = client.db('noteplay').collection('orders');
 * }
 *
 * async function createOrder(order) {
 *   await ordersCollection.insertOne({ ...order, paymentStatus: 'pending', status: 'received', createdAt: new Date() });
 *   return order.id;
 * }
 *
 * async function markOrderPaid(orderId, paymentMethod, paymentReference) {
 *   await ordersCollection.updateOne(
 *     { id: orderId },
 *     { $set: { paymentStatus: 'paid', paymentMethod, paymentReference, status: 'in_production' } }
 *   );
 * }
 *
 * module.exports = { connect, createOrder, markOrderPaid };
 * ------------------------------------------------------------------
 */
