import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // For development only
    },
  });
};

export const sendWelcomeEmail = async (userEmail, userName) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Secure Notes Vault" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: 'Welcome to Secure Notes Vault! 🔐',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { margin: 20px 0; }
          .icon { display: inline-block; width: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Welcome to Secure Notes Vault</h1>
            <p>Your end-to-end encrypted note-taking solution</p>
          </div>
          <div class="content">
            <h2>Hi ${userName}!</h2>
            <p>Thank you for joining Secure Notes Vault. Your account has been created successfully with the following security features:</p>
            
            <div class="feature">
              <span class="icon">🔐</span> <strong>Two-Factor Authentication:</strong> Your account is protected with MFA
            </div>
            <div class="feature">
              <span class="icon">🔒</span> <strong>End-to-End Encryption:</strong> Your notes are encrypted before they leave your device
            </div>
            <div class="feature">
              <span class="icon">🛡️</span> <strong>Zero-Knowledge:</strong> We cannot see your notes, even if we wanted to
            </div>
            
            <p><strong>Important Security Reminders:</strong></p>
            <ul>
              <li>Keep your MFA device secure and backed up</li>
              <li>Remember your encryption passphrase - we cannot recover it</li>
              <li>Use a strong, unique password for your account</li>
            </ul>
            
            <p>Get started by creating your first encrypted note!</p>
            
            <p>Best regards,<br>The Secure Notes Vault Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};

export const sendLoginNotification = async (userEmail, userName, loginInfo) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Secure Notes Vault" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: 'Login Notification - Secure Notes Vault',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #e0f2fe; border-left: 4px solid #0891b2; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔓 Successful Login</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName},</h2>
            <p>We wanted to let you know that you successfully logged into your Secure Notes Vault account.</p>
            
            <div class="info-box">
              <p><strong>Login Details:</strong></p>
              <p><strong>Time:</strong> ${loginInfo.timestamp}</p>
              <p><strong>IP Address:</strong> ${loginInfo.ip}</p>
              <p><strong>User Agent:</strong> ${loginInfo.userAgent}</p>
            </div>
            
            <p>If this wasn't you, please secure your account immediately by:</p>
            <ul>
              <li>Changing your password</li>
              <li>Checking your MFA device</li>
              <li>Reviewing any suspicious activity</li>
            </ul>
            
            <p>Your security is our priority. Stay safe!</p>
            
            <p>Best regards,<br>The Secure Notes Vault Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Login notification sent to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send login notification:', error);
  }
};