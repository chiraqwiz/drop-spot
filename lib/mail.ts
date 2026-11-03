import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

export function isEmailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);
}

function transporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetLink: string) {  const from = SMTP_FROM || SMTP_USER!;
  await transporter().sendMail({
    from: `"DROP SPOT" <${from}>`,
    to,
    subject: 'Reset your DROP SPOT password',
    text: [
      `Hi ${name},`,
      '',
      'Someone asked to reset the password for your DROP SPOT account.',
      'If that was you, set a new password with this link (it expires in 30 minutes):',
      '',
      resetLink,
      '',
      "If you didn't ask for this, you can ignore this email — your password won't change.",
    ].join('\n'),
    html: [
      `<p>Hi ${name},</p>`,
      '<p>Someone asked to reset the password for your DROP SPOT account.</p>',
      '<p>If that was you, <a href="' + resetLink + '">set a new password here</a> (the link expires in 30 minutes).</p>',
      "<p>If you didn't ask for this, you can ignore this email — your password won't change.</p>",
    ].join(''),
  });
}

export async function sendVerificationEmail(to: string, name: string, code: string) {
  const from = SMTP_FROM || SMTP_USER!;
  await transporter().sendMail({
    from: `"DROP SPOT" <${from}>`,
    to,
    subject: 'Verify your DROP SPOT account',
    text: [
      `Hi ${name},`,
      '',
      'Welcome to DROP SPOT! Please verify that this email address is yours',
      'by entering this code in the app (it expires in 15 minutes):',
      '',
      code,
      '',
      "If you didn't create a DROP SPOT account, you can ignore this email.",
    ].join('\n'),
    html: [
      `<p>Hi ${name},</p>`,
      '<p>Welcome to DROP SPOT! Please verify that this email address is yours by entering this code in the app (it expires in 15 minutes):</p>',
      `<p style="font-size: 28px; font-weight: bold; letter-spacing: 8px;">${code}</p>`,
      "<p>If you didn't create a DROP SPOT account, you can ignore this email.</p>",
    ].join(''),
  });
}
