/* Checkout page — tab switching, order summary, mock payment handoff
   In production, replace the fetch() calls below with real requests to
   your backend (see /backend/routes/stripe.js and /backend/routes/paypal.js). */

document.addEventListener('DOMContentLoaded', () => {
  const order = JSON.parse(sessionStorage.getItem('noteplay_order') || 'null');

  if (!order) {
    // No order in session — send the customer back to build one.
    window.location.href = 'order.html';
    return;
  }

  const money = (n) => '$' + Number(n).toFixed(2);

  document.getElementById('cSongFor').textContent = order.songFor;
  document.getElementById('cPlan').textContent = order.planLabel;
  document.getElementById('cStyle').textContent = order.styleLabel;
  document.getElementById('cMood').textContent = order.moodLabel;
  document.getElementById('cLength').textContent = order.lengthLabel;
  document.getElementById('cCommercial').textContent = order.commercialUse ? 'Yes' : 'No';
  document.getElementById('cTotal').textContent = money(order.price);
  document.getElementById('stripeAmount').textContent = money(order.price);
  document.getElementById('paypalAmount').textContent = money(order.price);

  /* ---- Tabs ---- */
  const tabs = document.querySelectorAll('.pay-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.pay-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  /* ---- Stripe (mock) ----
     Production flow:
       1. POST order to /api/create-checkout-session
       2. Backend creates a Stripe Checkout Session and returns its id/url
       3. Redirect the browser to the Stripe-hosted checkout page          */
  const stripeForm = document.getElementById('stripeForm');
  stripeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('stripePayBtn');
    btn.disabled = true;
    btn.textContent = 'Processing…';

    try {
      // const res = await fetch('/api/create-checkout-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(order)
      // });
      // const { url } = await res.json();
      // window.location.href = url; // redirect to Stripe-hosted checkout

      await mockDelay(1200);
      order.paymentMethod = 'stripe';
      order.orderId = generateOrderId();
      sessionStorage.setItem('noteplay_order', JSON.stringify(order));
      window.location.href = 'success.html';
    } catch (err) {
      alert('Payment failed. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Pay ' + money(order.price);
    }
  });

  /* ---- PayPal (mock) ----
     Production flow uses the PayPal JS SDK to render real buttons and
     calls /api/paypal/create-order then /api/paypal/capture-order.      */
  document.getElementById('paypalPayBtn').addEventListener('click', async () => {
    const btn = document.getElementById('paypalPayBtn');
    btn.disabled = true;
    btn.textContent = 'Redirecting to PayPal…';

    await mockDelay(1200);
    order.paymentMethod = 'paypal';
    order.orderId = generateOrderId();
    sessionStorage.setItem('noteplay_order', JSON.stringify(order));
    window.location.href = 'success.html';
  });

  function mockDelay(ms) { return new Promise(res => setTimeout(res, ms)); }
  function generateOrderId() {
    return 'NOTE-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
});
