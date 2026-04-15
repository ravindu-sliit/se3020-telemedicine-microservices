require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = Number(process.env.PORT) || 5007;

app.use(express.json());
app.use(cors());

const hasEmailCredentials = Boolean(process.env.EMAIL_USER) && Boolean(process.env.EMAIL_APP_PASSWORD);

const emailTransporter = hasEmailCredentials
  ? nodemailer.createTransport({
      service: 'gmail',
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

app.post('/api/notifications/send', async (req, res) => {
  try {
    const { patientEmail, message } = req.body;

    if (!message || !patientEmail) {
      return res.status(400).json({
        error: 'Message and patientEmail are required.'
      });
    }

    if (!emailTransporter) {
      return res.status(400).json({
        error: 'Email credentials are not configured.'
      });
    }

    const emailResult = await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: patientEmail,
      subject: 'Telemedicine Appointment Update',
      text: message
    });

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

    return res.status(500).json({
      error: 'Failed to send notifications.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});
