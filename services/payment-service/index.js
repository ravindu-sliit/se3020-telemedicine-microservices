require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const PORT = Number(process.env.PORT) || 5006;

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
    const { appointmentId, amount, currency = 'usd' } = req.body;

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
        appointmentId
      },
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

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
