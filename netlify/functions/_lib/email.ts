import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "0", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_SECURE = (process.env.SMTP_SECURE || "").toLowerCase() === "true";
const SMTP_FROM = process.env.SMTP_FROM || "";

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

export function assertEmailConfigured() {
  if (!SMTP_HOST) throw new Error("Missing SMTP_HOST");
  if (!SMTP_PORT) throw new Error("Missing SMTP_PORT");
  if (!SMTP_USER) throw new Error("Missing SMTP_USER");
  if (!SMTP_PASS) throw new Error("Missing SMTP_PASS");
  if (!SMTP_FROM) throw new Error("Missing SMTP_FROM");
}

export async function sendEmail(args: SendEmailArgs) {
  assertEmailConfigured();

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
  });
}
