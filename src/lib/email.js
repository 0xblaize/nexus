import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!transporter) {
    // Using Gmail or your email provider
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPass) {
      console.warn(
        "EMAIL_USER or EMAIL_PASSWORD not configured. Email notifications disabled.",
      );
      return null;
    }

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  return transporter;
}

export async function sendSignalNotification({ to, company, signals, score, recommendation }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("Email service not configured. Skipping notification.");
    return;
  }

  const signalSummary = signals
    .slice(0, 5)
    .map((signal) => `<li><strong>${signal.type}:</strong> ${signal.title}</li>`)
    .join("");

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">🔔 New Signal Alert: ${company}</h2>
      
      <div style="background-color: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Score:</strong> <span style="font-size: 24px; color: #1a73e8;">${score}</span></p>
        <p><strong>Recommendation:</strong> <span style="color: #34a853; font-weight: bold;">${recommendation}</span></p>
        <p><strong>Total Signals Detected:</strong> ${signals.length}</p>
      </div>

      <h3>Signal Breakdown:</h3>
      <ul style="list-style: none; padding: 0;">
        ${signalSummary}
      </ul>

      ${signals.length > 5 ? `<p><em>...and ${signals.length - 5} more signals</em></p>` : ""}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
        <p>This is an automated alert from NEXUS. Check your dashboard for full details.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `🔔 Signal Alert: ${company} - Score ${score}`,
      html: htmlContent,
    });

    console.log(`✓ Email sent to ${to} for company ${company}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

export async function sendTeamNotification({ teamMembers, company, signals, score, recommendation }) {
  if (!teamMembers || teamMembers.length === 0) {
    console.log("No team members to notify");
    return;
  }

  const emailPromises = teamMembers.map((member) =>
    sendSignalNotification({
      to: member.email,
      company,
      signals,
      score,
      recommendation,
    }).catch((error) => {
      console.error(`Failed to send to ${member.email}:`, error.message);
    }),
  );

  await Promise.all(emailPromises);
}

export async function sendDailyDigest({ to, reports }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("Email service not configured. Skipping digest.");
    return;
  }

  const reportRows = reports
    .slice(0, 10)
    .map((report) => {
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px; text-align: left;">${report.company}</td>
          <td style="padding: 12px; text-align: center; color: #1a73e8; font-weight: bold;">${report.score}</td>
          <td style="padding: 12px; text-align: center;">${report.signalCount} signals</td>
          <td style="padding: 12px; text-align: center;">${report.recommendation}</td>
        </tr>
      `;
    })
    .join("");

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">📊 NEXUS Daily Digest</h2>
      
      <p>Here's your daily summary of tracked companies:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f0f4f8;">
            <th style="padding: 12px; text-align: left; font-weight: bold;">Company</th>
            <th style="padding: 12px; text-align: center; font-weight: bold;">Score</th>
            <th style="padding: 12px; text-align: center; font-weight: bold;">Signals</th>
            <th style="padding: 12px; text-align: center; font-weight: bold;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${reportRows}
        </tbody>
      </table>

      ${reports.length > 10 ? `<p><em>...and ${reports.length - 10} more companies</em></p>` : ""}

      <div style="margin-top: 30px; padding: 20px; background-color: #f0f4f8; border-radius: 8px;">
        <p style="margin: 0;"><strong>Need to adjust your preferences?</strong> Visit your dashboard settings to manage team members and notification preferences.</p>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
        <p>This is an automated digest from NEXUS.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "📊 NEXUS Daily Digest",
      html: htmlContent,
    });

    console.log(`✓ Daily digest sent to ${to}`);
  } catch (error) {
    console.error("Failed to send digest:", error);
    throw error;
  }
}
