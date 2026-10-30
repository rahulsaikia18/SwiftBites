const nodemailer = require('nodemailer');

/**
 * Create and configure nodemailer SMTP transporter.
 * Supports standard SMTP (Gmail, Outlook, Mailgun, SendGrid, Mailtrap, custom SMTP).
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || '';
  const rawPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || '';
  
  // Gmail app passwords frequently contain spaces (e.g., "abcd efgh ijkl mnop").
  // Strip whitespace if it matches a 16-character Google App Password format.
  const pass = rawPass.includes(' ') && rawPass.replace(/\s+/g, '').length === 16
    ? rawPass.replace(/\s+/g, '')
    : rawPass.trim();

  const isSecure = process.env.SMTP_SECURE === 'true' || 
                   process.env.EMAIL_SECURE === 'true' || 
                   port === 465;

  const transportConfig = {
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };

  // If a specific service like 'gmail' is explicitly requested
  if (process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE) {
    transportConfig.service = process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE;
  }

  return nodemailer.createTransport(transportConfig);
};

/**
 * Generate a responsive branded SwiftBites HTML email template
 */
const getBrandedHtml = (title, content, footerNote = '') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .content { padding: 32px 28px; }
    .title { font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px; color: #0f172a; }
    .body-text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .otp-card { background: #fff7ed; border: 2px dashed #fdba74; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ea580c; margin: 0; font-family: 'Courier New', Courier, monospace; }
    .otp-hint { font-size: 12px; color: #9a3412; margin-top: 8px; margin-bottom: 0; }
    .footer { padding: 20px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍔 SwiftBites</h1>
    </div>
    <div class="content">
      <h2 class="title">${title}</h2>
      <div class="body-text">${content}</div>
      ${footerNote ? `<p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">${footerNote}</p>` : ''}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} SwiftBites Food Delivery Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

/**
 * Send an email using SMTP
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Plain text message
 * @param {string} [options.otp] - Optional OTP code to format nicely
 * @param {string} [options.html] - Custom HTML content
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    const sender = process.env.EMAIL_FROM || 
                   process.env.SMTP_FROM || 
                   `"SwiftBites" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@swiftbites.com'}>`;

    const htmlContent = options.html || getBrandedHtml(
      options.subject || 'SwiftBites Notification',
      options.otp 
        ? `<p>We received a request to authenticate or reset your password. Use the verification code below:</p>
           <div class="otp-card">
             <div class="otp-code">${options.otp}</div>
             <p class="otp-hint">Expires in 10 minutes • Do not share this code with anyone</p>
           </div>
           <p>If you did not request this, you can safely ignore this email.</p>`
        : `<p>${(options.message || '').replace(/\n/g, '<br/>')}</p>`
    );

    const message = {
      from: sender,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: htmlContent,
    };

    const info = await transporter.sendMail(message);
    console.log(`[SMTP] Email successfully sent to ${options.email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[SMTP] Email delivery error to ${options.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verify current SMTP connection credentials
 */
const verifySMTP = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('[SMTP] Connection to SMTP server established successfully.');
    return true;
  } catch (error) {
    console.warn('[SMTP] Connection check failed:', error.message);
    return false;
  }
};

module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
module.exports.createTransporter = createTransporter;
module.exports.verifySMTP = verifySMTP;
