require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const dns = require('dns');

dns.setServers(["1.1.1.1","8.8.8.8"]);

const app = express();
const PORT = Number(process.env.PORT) || 5006;
const NOTIFICATION_API_URL =
  process.env.NOTIFICATION_API_URL || 'http://notification-service:5007/api/notifications/send';

app.use(express.json());
app.use(cors());

const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY);
const stripe = hasStripeKey ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payment service is running',
    mode: hasStripeKey ? 'stripe' : 'mock'
  });
});

app.post('/api/payments/checkout', async (req, res) => {
  try {
    const { appointmentId, amount, currency = 'usd', patientEmail } = req.body;

    if (!appointmentId || amount === undefined || amount === null) {
      return res.status(400).json({
        error: 'appointmentId and amount are required.'
      });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({
        error: 'amount must be a positive number.'
      });
    }

    const useMockOnly = process.env.PAYMENT_MOCK_ONLY === 'true';
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

    if (useMockOnly || !stripe) {
      const mockToken = Buffer.from(`${appointmentId}:${Date.now()}`).toString('base64url');
      const mockCheckoutUrl = `${frontendBaseUrl}/payments/mock-checkout?appointmentId=${encodeURIComponent(
        appointmentId
      )}&amount=${encodeURIComponent(normalizedAmount.toFixed(2))}&token=${encodeURIComponent(mockToken)}`;

      return res.status(200).json({
        success: true,
        provider: 'mock',
        appointmentId,
        amount: normalizedAmount,
        currency: currency.toLowerCase(),
        checkoutUrl: mockCheckoutUrl,
        message: 'Mock checkout URL generated. Set STRIPE_SECRET_KEY to use live Stripe test checkout.'
      });
    }

    const successUrl =
      process.env.PAYMENT_SUCCESS_URL ||
      `${frontendBaseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = process.env.PAYMENT_CANCEL_URL || `${frontendBaseUrl}/payments/cancel`;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        appointmentId,
        patientEmail: patientEmail || ''
      },
      ...(patientEmail ? { customer_email: patientEmail } : {}),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(normalizedAmount * 100),
            product_data: {
              name: `Telemedicine Appointment ${appointmentId}`,
              description: `Consultation payment for appointment ${appointmentId}`
            }
          }
        }
      ]
    });

    return res.status(200).json({
      success: true,
      provider: 'stripe',
      appointmentId,
      amount: normalizedAmount,
      currency: currency.toLowerCase(),
      sessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';
    const statusCode = error?.statusCode || error?.status || 500;

    console.error('Payment checkout error:', {
      message: error?.message,
      type: error?.type,
      code: error?.code
    });

    if (isProduction) {
      return res.status(500).json({ error: 'Failed to create checkout session.' });
    }

    return res.status(statusCode).json({
      error: 'Failed to create checkout session.',
      debug: {
        message: error?.message,
        type: error?.type,
        code: error?.code
      }
    });
  }
});

app.post('/api/payments/confirm', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    if (!stripe) {
      return res.status(400).json({ error: 'Stripe is not configured.' });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const isPaid = checkoutSession?.payment_status === 'paid';

    if (!isPaid) {
      return res.status(400).json({
        success: false,
        paid: false,
        message: 'Payment is not completed yet.'
      });
    }

    const recipientEmail =
      checkoutSession?.customer_details?.email ||
      checkoutSession?.customer_email ||
      checkoutSession?.metadata?.patientEmail ||
      '';

    if (!recipientEmail) {
      return res.status(200).json({
        success: true,
        paid: true,
        notified: false,
        message: 'Payment confirmed, but no recipient email found.'
      });
    }

    const notificationResponse = await fetch(NOTIFICATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patientEmail: recipientEmail,
        message: `Payment completed successfully for appointment ${checkoutSession?.metadata?.appointmentId || 'N/A'}.`
      })
    });

    const notificationPayload = await notificationResponse.json().catch(() => ({}));

    return res.status(200).json({
      success: true,
      paid: true,
      notified: notificationResponse.ok,
      recipientEmail,
      notification: notificationPayload
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';
    console.error('Payment confirmation error:', {
      message: error?.message,
      type: error?.type,
      code: error?.code
    });

    if (isProduction) {
      return res.status(500).json({ error: 'Failed to confirm payment session.' });
    }

    return res.status(500).json({
      error: 'Failed to confirm payment session.',
      debug: {
        message: error?.message,
        type: error?.type,
        code: error?.code
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
