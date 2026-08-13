import nodemailer, { type Transporter } from "nodemailer";

export interface SenderCredentials {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
}

export interface SendEmailInput {
  from: string;
  to: string;
  subject: string;
  text: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | false;
}

const transporterCache = new Map<string, Transporter>();

function getTransporter(creds: SenderCredentials): Transporter {
  const cacheKey = `${creds.smtpHost}:${creds.smtpPort}:${creds.username}`;
  let transporter = transporterCache.get(cacheKey);
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: creds.smtpHost,
      port: creds.smtpPort,
      secure: creds.smtpPort === 465,
      auth: { user: creds.username, pass: creds.password },
    });
    transporterCache.set(cacheKey, transporter);
  }
  return transporter;
}

export async function sendEmail(creds: SenderCredentials, mail: SendEmailInput): Promise<SendEmailResult> {
  const transporter = getTransporter(creds);
  const info = await transporter.sendMail({
    from: mail.from,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
  });
  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info),
  };
}

// Generates a throwaway Ethereal Email test account (inbox viewable via the
// preview URL returned from sendEmail). Used in place of real, OAuth-derived
// sender credentials while Google OAuth is not yet wired up.
export async function createEtherealSender(): Promise<SenderCredentials & { email: string }> {
  const account = await nodemailer.createTestAccount();
  return {
    email: account.user,
    smtpHost: account.smtp.host,
    smtpPort: account.smtp.port,
    username: account.user,
    password: account.pass,
  };
}
