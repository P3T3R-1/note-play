/* Checkout page — tab switching, order summary, real Stripe/PayPal handoff.
   Requires js/config.js to be loaded first (defines API_BASE). */

document.addEventListener('DOMContentLoaded', () => {
  const order = JSON.parse(sessionStorage.getItem('noteplay_order') || 'null');

  if (!order || !order.orderId) {
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

  const tabs = document.querySelectorAll('.pay-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.pay-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  document.getElementById('stripePayBtn').addEventListener('click', async () => {
    const btn = document.getElementById('stripePayBtn');
    btn.disabled = true;
    btn.textContent = 'Redirecting to Stripe…';

    try {
      const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId })
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not start Stripe checkout.');
      }

      window.location.href = data.url;
    } catch (err) {
      alert(err.message || 'Payment failed to start. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Continue to Stripe — ' + money(order.price);
    }
  });

  document.getElementById('paypalPayBtn').addEventListener('click', async () => {
    const btn = document.getElementById('paypalPayBtn');
    btn.disabled = true;
    btn.textContent = 'Redirecting to PayPal…';

    try {
      const res = await fetch(`${API_BASE}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId })
      });
      const data = await res.json();

      if (!res.ok || !data.approveUrl) {
        throw new Error(data.error || 'Could not start PayPal checkout.');
      }

      sessionStorage.setItem('noteplay_paypal_order_id', order.orderId);
      window.location.href = data.approveUrl;
    } catch (err) {
      alert(err.message || 'Payment failed to start. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Pay with PayPal — ' + money(order.price);
    }
  });
});
