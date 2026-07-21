/**
 * email/sendEmail.js
 * ------------------------------------------------------------------
 * Sends an order confirmation email once payment succeeds.
 * Works with any SMTP provider (SendGrid, Postmark, Mailgun, Gmail).
 * ------------------------------------------------------------------
 */

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendOrderConfirmation(order) {
  const html = `
    <div style="font-family:Arial,sans-serif;background:#0A0A14;color:#F4F3FA;padding:32px;">
      <h1 style="color:#B9A6FF;">Your song is in production 🎧</h1>
      <p>Hi ${order.fullName},</p>
      <p>Thanks for your order with <strong>Noteplay</strong>. Here's a summary:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:6px 0;color:#9B98B0;">Order ID</td><td>${order.id}</td></tr>
        <tr><td style="padding:6px 0;color:#9B98B0;">Song for</td><td>${order.songFor}</td></tr>
        <tr><td style="padding:6px 0;color:#9B98B0;">Plan</td><td>${order.plan}</td></tr>
        <tr><td style="padding:6px 0;color:#9B98B0;">Style / Mood</td><td>${order.style} / ${order.mood}</td></tr>
        <tr><td style="padding:6px 0;color:#9B98B0;">Total paid</td><td>$${order.price}</td></tr>
      </table>
      <p>Your track will be delivered within 3 days as an MP3 and WAV file, along with one free revision.</p>
      <p>— The Noteplay team</p>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: order.email,
    subject: `Order confirmed — ${order.id}`,
    html
  });
}

async function sendDeliveryEmail(order, downloadLinks) {
  const html = `
    <div style="font-family:Arial,sans-serif;background:#0A0A14;color:#F4F3FA;padding:32px;">
      <h1 style="color:#22D3EE;">Your track is ready 🎶</h1>
      <p>Hi ${order.fullName}, your custom song for "${order.songFor}" is complete.</p>
      <p>
        <a href="${downloadLinks.mp3}" style="color:#22D3EE;">Download MP3</a> &nbsp;|&nbsp;
        <a href="${downloadLinks.wav}" style="color:#22D3EE;">Download WAV</a>
      </p>
      <p>Not quite right? Reply to this email with your revision notes — one round is included free.</p>
    </div>
  `;
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: order.email,
    subject: `Your Noteplay track is ready — ${order.id}`,
    html
  });
}

module.exports = { sendOrderConfirmation, sendDeliveryEmail };
