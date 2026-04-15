require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const twilio = require('twilio');
const nodemailer = require('nodemailer');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = Number(process.env.PORT) || 5007;
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS) || 15000;

app.use(express.json());
app.use(cors());

// Twilio notification path is intentionally disabled.
// const hasTwilioCredentials =
//   Boolean(process.env.TWILIO_ACCOUNT_SID) &&
//   Boolean(process.env.TWILIO_AUTH_TOKEN) &&
//   Boolean(process.env.TWILIO_PHONE_NUMBER);

const hasEmailCredentials =
  Boolean(process.env.EMAIL_USER) &&
  Boolean(process.env.EMAIL_APP_PASSWORD) &&
  process.env.EMAIL_USER !== 'your_email@gmail.com' &&
  process.env.EMAIL_APP_PASSWORD !== 'your_email_app_password';

// const twilioClient = hasTwilioCredentials
//   ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
//   : null;

const emailTransporter = hasEmailCredentials
  ? nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: EMAIL_SEND_TIMEOUT_MS,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    })
  : null;

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notification service is running',
    channels: {
      sms: 'disabled',
      email: hasEmailCredentials ? 'configured' : 'not-configured'
    }
  });
});

app.get('/api/notifications/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notification service is running',
    channels: {
      sms: 'disabled',
      email: hasEmailCredentials ? 'configured' : 'not-configured'
    }
  });
});

app.post('/api/notifications/send', async (req, res) => {
  try {
    const { patientEmail, message } = req.body;

    if (!message || !patientEmail) {
      return res.status(400).json({
        error: 'Message and patientEmail are required.'
      });
    }

    if (!emailTransporter) {
      return res.status(200).json({
        success: true,
        message: 'Notifications processed in mock mode.',
        mode: 'mock',
        results: [
          {
            channel: 'email',
            status: 'skipped',
            reason: 'Email credentials are not configured.'
          }
        ]
      });
    }

    // Bound SMTP latency so ingress receives a response before its upstream timeout.
    const emailResult = await Promise.race([
      emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: patientEmail,
        subject: 'Telemedicine Appointment Update',
        text: message
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email send timeout exceeded')), EMAIL_SEND_TIMEOUT_MS);
      })
    ]);

    return res.status(200).json({
      success: true,
      message: 'Notifications processed.',
      results: [
        {
          channel: 'email',
          status: 'sent',
          messageId: emailResult.messageId
        }
      ]
    });
  } catch (error) {
    console.error('Notification Service Error:', {
      message: error?.message,
      code: error?.code
    });

    return res.status(200).json({
      success: true,
      message: 'Notifications processed with delivery issues.',
      mode: 'degraded',
      results: [
        {
          channel: 'email',
          status: 'failed',
          reason: error?.message || 'Unknown email delivery error'
        }
      ]
    });
  }
});

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});
