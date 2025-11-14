import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Create and configure nodemailer transporter
 */
function createTransporter() {
  // Use environment variables for email configuration
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
    },
  });

  return transporter;
}

/**
 * Send email using nodemailer
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "noreply@nextgencareer.com",
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ""), // Fallback to plain text if HTML provided
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}

