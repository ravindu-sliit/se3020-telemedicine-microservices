require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = Number(process.env.PORT) || 5007;
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS) || 15000;
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'auto').toLowerCase();
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER;
const TWILIO_FROM_NUMBER =
  process.env.TWILIO_PHONE_NUMBER ||
  process.env.TWILIO_PHONE_NUMBER_FROM ||
  process.env.TWILIO_PHONE_NUMBER_FRom;
const APP_NAME = 'Smart Healthcare Telemedicine';
const APP_URL = process.env.APP_URL || 'http://smart-healthcare.local';

app.use(express.json());
app.use(cors());

const hasTwilioCredentials =
  Boolean(process.env.TWILIO_ACCOUNT_SID) &&
  Boolean(process.env.TWILIO_AUTH_TOKEN) &&
  Boolean(TWILIO_FROM_NUMBER);

const hasEmailCredentials =
  Boolean(process.env.EMAIL_USER) &&
  Boolean(process.env.EMAIL_APP_PASSWORD) &&
  process.env.EMAIL_USER !== 'your_email@gmail.com' &&
  process.env.EMAIL_APP_PASSWORD !== 'your_email_app_password';

const hasSendGridCredentials =
  Boolean(process.env.SENDGRID_API_KEY) &&
  Boolean(EMAIL_FROM);

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderNotificationEmail = ({ headline, message }) => {
  const safeHeadline = escapeHtml(headline);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeHeadline}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px;background:#f5f7fb;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:24px 28px;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#ffffff;">
                <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">${APP_NAME}</div>
                <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;">${safeHeadline}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 10px;font-size:15px;line-height:1.7;color:#374151;">
                ${safeMessage}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 26px;">
                <a href="${APP_URL}" style="display:inline-block;padding:11px 18px;border-radius:10px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
                  Open Patient Portal
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 22px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.6;">
                This is an automated notification from ${APP_NAME}. If you need help, contact your care provider.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const resolveEmailContext = ({ message, subject, headline, notificationType }) => {
  const normalizedMessage = String(message || '').trim();
  const lowered = normalizedMessage.toLowerCase();
  const normalizedType = String(notificationType || '').toLowerCase();

  const inferredType = (() => {
    if (normalizedType) {
      return normalizedType;
    }

    if (lowered.includes('payment')) {
      return 'payment';
    }

    if (lowered.includes('rescheduled')) {
      return 'appointment_rescheduled';
    }

    if (lowered.includes('cancelled') || lowered.includes('canceled')) {
      return 'appointment_cancelled';
    }

    if (lowered.includes('appointment') && lowered.includes('created')) {
      return 'appointment_created';
    }

    if (lowered.includes('appointment')) {
      return 'appointment_update';
    }

    return 'general';
  })();

  const defaultsByType = {
    payment: {
      subject: 'Payment Confirmation',
      headline: 'Payment Confirmed',
      intro: 'Your payment has been received successfully.'
    },
    appointment_created: {
      subject: 'Appointment Request Received',
      headline: 'Appointment Request Created',
      intro: 'Your appointment request has been recorded.'
    },
    appointment_rescheduled: {
      subject: 'Appointment Rescheduled',
      headline: 'Appointment Updated',
      intro: 'Your appointment schedule has been updated.'
    },
    appointment_cancelled: {
      subject: 'Appointment Cancellation Notice',
      headline: 'Appointment Cancelled',
      intro: 'This is a confirmation that an appointment has been cancelled.'
    },
    appointment_update: {
      subject: 'Appointment Update',
      headline: 'Appointment Notification',
      intro: 'There is an update regarding your appointment.'
    },
    general: {
      subject: 'Healthcare Notification',
      headline: 'Important Notification',
      intro: 'You have received an update from your care platform.'
    }
  };

  const selectedDefaults = defaultsByType[inferredType] || defaultsByType.general;
  const finalSubject = String(subject || '').trim() || selectedDefaults.subject;
  const finalHeadline = String(headline || '').trim() || selectedDefaults.headline;
  const finalBody = `${selectedDefaults.intro}\n\n${normalizedMessage}\n\nThank you for choosing ${APP_NAME}.`;

  return {
    subject: finalSubject,
    headline: finalHeadline,
    body: finalBody
  };
};

const twilioClient = hasTwilioCredentials
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const sendSmsWithTwilio = async ({ to, message }) => {
  if (!twilioClient) {
    throw new Error('Twilio credentials are not configured');
  }

  const response = await twilioClient.messages.create({
    to,
    from: TWILIO_FROM_NUMBER,
    body: message
  });

  return {
    provider: 'twilio',
    sid: response?.sid || null,
    status: response?.status || null
  };
};

const createEmailTransporter = async () => {
  if (!hasEmailCredentials) {
    return null;
  }

  let smtpHost = 'smtp.gmail.com';
  try {
    const ipv4Addresses = await dns.promises.resolve4('smtp.gmail.com');
    if (Array.isArray(ipv4Addresses) && ipv4Addresses.length > 0) {
      smtpHost = ipv4Addresses[0];
    }
  } catch (_error) {
    // Fall back to hostname if IPv4 resolution fails.
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: 465,
    secure: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: EMAIL_SEND_TIMEOUT_MS,
    tls: {
      servername: 'smtp.gmail.com'
    },
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

const sendEmailWithSendGrid = async ({ to, subject, text, html }) => {
  if (!hasSendGridCredentials) {
    throw new Error('SendGrid credentials are not configured');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }]
        }
      ],
      from: { email: EMAIL_FROM },
      subject,
      content: [
        {
          type: 'text/plain',
          value: text
        },
        {
          type: 'text/html',
          value: html
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`SendGrid API error (${response.status}): ${body || 'Unknown error'}`);
  }

  return {
    provider: 'sendgrid',
    messageId: response.headers.get('x-message-id') || null
  };
};

const sendEmailWithFallback = async ({ to, subject, text, html }) => {
  const baseTransporter = await createEmailTransporter();
  if (!baseTransporter) {
    throw new Error('Email transporter is not configured');
  }

  const transporterConfigs = [
    {
      host: baseTransporter.options.host,
      port: 465,
      secure: true,
      requireTLS: false
    },
    {
      host: baseTransporter.options.host,
      port: 587,
      secure: false,
      requireTLS: true
    }
  ];

  let lastError = null;

  for (const config of transporterConfigs) {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.requireTLS,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: EMAIL_SEND_TIMEOUT_MS,
      tls: {
        servername: 'smtp.gmail.com'
      },
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    try {
      const result = await Promise.race([
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to,
          subject,
          text,
          html
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Email send timeout exceeded')), EMAIL_SEND_TIMEOUT_MS);
        })
      ]);

      return result;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Email delivery failed');
};

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notification service is running',
    channels: {
      sms: hasTwilioCredentials ? 'configured' : 'not-configured',
      email: hasEmailCredentials || hasSendGridCredentials ? 'configured' : 'not-configured'
    },
    providers: {
      selected: EMAIL_PROVIDER,
      sendgrid: hasSendGridCredentials ? 'configured' : 'not-configured',
      smtp: hasEmailCredentials ? 'configured' : 'not-configured',
      twilio: hasTwilioCredentials ? 'configured' : 'not-configured'
    }
  });
});

app.get('/api/notifications/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notification service is running',
    channels: {
      sms: hasTwilioCredentials ? 'configured' : 'not-configured',
      email: hasEmailCredentials || hasSendGridCredentials ? 'configured' : 'not-configured'
    },
    providers: {
      selected: EMAIL_PROVIDER,
      sendgrid: hasSendGridCredentials ? 'configured' : 'not-configured',
      smtp: hasEmailCredentials ? 'configured' : 'not-configured',
      twilio: hasTwilioCredentials ? 'configured' : 'not-configured'
    }
  });
});

app.post('/api/notifications/send', async (req, res) => {
  try {
    const { patientEmail, patientPhone, message, subject, headline, notificationType } = req.body;

    if (!message || (!patientEmail && !patientPhone)) {
      return res.status(400).json({
        error: 'Message and at least one recipient (patientEmail or patientPhone) are required.'
      });
    }

    if (!hasEmailCredentials && !hasSendGridCredentials && !hasTwilioCredentials) {
      return res.status(200).json({
        success: true,
        message: 'Notifications processed in mock mode.',
        mode: 'mock',
        results: [
          {
            channel: 'email',
            status: 'skipped',
            reason: 'Email credentials are not configured.'
          },
          {
            channel: 'sms',
            status: 'skipped',
            reason: 'Twilio credentials are not configured.'
          }
        ]
      });
    }

    const results = [];
    const emailContext = resolveEmailContext({
      message,
      subject,
      headline,
      notificationType
    });
    const html = renderNotificationEmail({
      headline: emailContext.headline,
      message: emailContext.body
    });

    if (patientEmail) {
      try {
        let emailResult = null;
        if (EMAIL_PROVIDER === 'sendgrid' || (EMAIL_PROVIDER === 'auto' && hasSendGridCredentials)) {
          emailResult = await sendEmailWithSendGrid({
            to: patientEmail,
            subject: emailContext.subject,
            text: emailContext.body,
            html
          });
        } else {
          const emailTransporter = await createEmailTransporter();
          if (emailTransporter) {
            emailResult = await sendEmailWithFallback({
              to: patientEmail,
              subject: emailContext.subject,
              text: emailContext.body,
              html
            });
          }
        }

        if (emailResult) {
          results.push({
            channel: 'email',
            status: 'sent',
            provider: emailResult.provider || 'smtp',
            messageId: emailResult.messageId || null
          });
        } else {
          results.push({
            channel: 'email',
            status: 'skipped',
            reason: 'Email credentials are not configured.'
          });
        }
      } catch (emailError) {
        results.push({
          channel: 'email',
          status: 'failed',
          reason: emailError?.message || 'Unknown email delivery error'
        });
      }
    }

    if (patientPhone) {
      if (!hasTwilioCredentials) {
        results.push({
          channel: 'sms',
          status: 'skipped',
          reason: 'Twilio credentials are not configured.'
        });
      } else {
        try {
          const smsResult = await sendSmsWithTwilio({
            to: patientPhone,
            message
          });

          results.push({
            channel: 'sms',
            status: 'sent',
            provider: smsResult.provider,
            sid: smsResult.sid,
            deliveryStatus: smsResult.status
          });
        } catch (smsError) {
          results.push({
            channel: 'sms',
            status: 'failed',
            reason: smsError?.message || 'Unknown SMS delivery error'
          });
        }
      }
    }

    const hasFailures = results.some((entry) => entry.status === 'failed');

    return res.status(200).json({
      success: true,
      message: hasFailures
        ? 'Notifications processed with delivery issues.'
        : 'Notifications processed.',
      mode: hasFailures ? 'degraded' : EMAIL_PROVIDER,
      results
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
