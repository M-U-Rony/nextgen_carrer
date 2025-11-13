import nodemailer from "nodemailer";

// Create reusable transporter
// Defaults to Mailtrap for testing (emails are captured, not actually sent)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT || "2525"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.MAILTRAP_USER,
    pass: process.env.SMTP_PASS || process.env.MAILTRAP_PASS,
  },
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP configuration error:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const fromEmail = process.env.SMTP_USER || process.env.MAILTRAP_USER || "noreply@nextgencareer.com";
    const info = await transporter.sendMail({
      from: `"Nextgen Career" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export default transporter;

