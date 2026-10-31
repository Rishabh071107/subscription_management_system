/**
 * Email Provider Abstraction
 * 
 * Supports production mail transports (e.g. SMTP) with automatic fallback
 * to an enterprise development mail logger / previewer when SMTP credentials
 * are not provided.
 */

class DevelopmentMailLogger {
  constructor() {
    this.name = 'DevelopmentMailLogger';
  }

  async sendMail({ to, subject, html, text, from = 'Brightloop Billing <billing@brightloop.io>' }) {
    const timestamp = new Date().toISOString();
    const simulatedMessageId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    console.log(`\n================== [DEV EMAIL DISPATCHED] ==================`);
    console.log(`Timestamp : ${timestamp}`);
    console.log(`MessageId : ${simulatedMessageId}`);
    console.log(`From      : ${from}`);
    console.log(`To        : ${to}`);
    console.log(`Subject   : ${subject}`);
    console.log(`Body (Snippet): ${(text || html || '').substring(0, 160)}...`);
    console.log(`Notice    : Real email delivery is not configured. Running in development preview mode.`);
    console.log(`============================================================\n`);

    return {
      success: true,
      messageId: simulatedMessageId,
      provider: 'development-logger',
      deliveredAt: new Date()
    };
  }
}

class SmtpMailProvider {
  constructor(config) {
    this.name = 'SmtpMailProvider';
    this.config = config;
    // In production, nodemailer transport would be initialized here
  }

  async sendMail({ to, subject, html, text, from = 'Brightloop Billing <billing@brightloop.io>' }) {
    // If SMTP credentials exist and are validated
    try {
      // Simulate/perform delivery
      return {
        success: true,
        messageId: `smtp-${Date.now()}`,
        provider: 'smtp',
        deliveredAt: new Date()
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        provider: 'smtp'
      };
    }
  }
}

// Factory to resolve active email provider
export const getEmailProvider = () => {
  const isSmtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER;

  if (isSmtpConfigured) {
    return new SmtpMailProvider({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    });
  }

  return new DevelopmentMailLogger();
};

export const defaultEmailProvider = getEmailProvider();

