require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const twilio = require('twilio');
const nodemailer = require('nodemailer');

const app = express();
const PORT = Number(process.env.PORT) || 5007;

app.use(express.json());
app.use(cors());

// Twilio notification path is intentionally disabled.
// const hasTwilioCredentials =
//   Boolean(process.env.TWILIO_ACCOUNT_SID) &&
//   Boolean(process.env.TWILIO_AUTH_TOKEN) &&
//   Boolean(process.env.TWILIO_PHONE_NUMBER);

const hasEmailCredentials = Boolean(process.env.EMAIL_USER) && Boolean(process.env.EMAIL_APP_PASSWORD);

// const twilioClient = hasTwilioCredentials
//   ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
//   : null;

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

    const notificationTasks = [];

    // Twilio SMS sending is disabled for now.
    // if (patientPhone) {
    //   if (!twilioClient) {
    //     notificationTasks.push(
    //       Promise.resolve({
    //         channel: 'sms',
    //         status: 'skipped',
    //         reason: 'Twilio credentials are not configured.'
    //       })
    //     );
    //   } else {
    //     const smsTask = twilioClient.messages
    //       .create({
    //         body: message,
    //         from: process.env.TWILIO_PHONE_NUMBER,
    //         to: patientPhone
    //       })
    //       .then((sms) => ({
    //         channel: 'sms',
    //         status: 'sent',
    //         sid: sms.sid
    //       }));
    //
    //     notificationTasks.push(smsTask);
    //   }
    // }

    if (patientEmail) {
      if (!emailTransporter) {
        notificationTasks.push(
          Promise.resolve({
            channel: 'email',
            status: 'skipped',
            reason: 'Email credentials are not configured.'
          })
        );
      } else {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: patientEmail,
          subject: 'Telemedicine Appointment Update',
          text: message
        };

        const emailTask = emailTransporter.sendMail(mailOptions).then((emailResult) => ({
          channel: 'email',
          status: 'sent',
          messageId: emailResult.messageId
        }));

        notificationTasks.push(emailTask);
      }
    }

    const settled = await Promise.allSettled(notificationTasks);
    const results = settled.map((entry) =>
      entry.status === 'fulfilled'
        ? entry.value
        : {
            channel: 'unknown',
            status: 'failed',
            error: entry.reason?.message || 'Unknown error'
          }
    );

    const hasFailures = results.some((result) => result.status === 'failed');

    return res.status(hasFailures ? 207 : 200).json({
      success: !hasFailures,
      message: 'Notifications processed.',
      results
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
