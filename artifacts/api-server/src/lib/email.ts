// Support both the raw xkeysib-... key and the base64-JSON wrapper
function resolveBrevoKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("xkeysib-")) return raw;
  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    return decoded.api_key ?? raw;
  } catch {
    return raw;
  }
}

const BREVO_API_KEY = resolveBrevoKey(process.env["BREVO_API_KEY"]);
const FROM_EMAIL    = (process.env["FROM_EMAIL"] ?? "").trim().replace(/[\r\n]/g, "");
const APP_URL       = process.env["APP_URL"] ?? "https://tag-website.replit.app";

function parseEmailParts(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>\s*$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: "TAG", email: from.trim() };
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!BREVO_API_KEY) {
    console.warn("[email] BREVO_API_KEY not set — email not sent to", to);
    return;
  }

  const sender = parseEmailParts(FROM_EMAIL);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${err}`);
  }

  const result = await res.json() as any;
  console.log(`[email] Sent OK → to=${to} from=${sender.email} messageId=${result?.messageId}`);
}

export function passwordResetEmail(username: string, token: string): string {
  const link = `${APP_URL}/portal/reset-password?token=${token}`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #0a0f0a; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo-box { display: inline-block; background: #0f1f0f; border: 1.5px solid #4ade80; padding: 10px 20px; }
    .logo-text { color: #4ade80; font-size: 22px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; margin: 0; }
    .card { background: #111827; border: 1px solid #1f2937; padding: 36px; }
    .title { color: #ffffff; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0; }
    .subtitle { color: #9ca3af; font-size: 13px; margin: 0 0 28px 0; }
    .body-text { color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; }
    .btn { display: block; text-align: center; background: #4ade80; color: #0a0f0a; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; padding: 16px 32px; text-decoration: none; margin: 24px 0; }
    .token-box { background: #0a0f0a; border: 1px solid #1f2937; padding: 12px 16px; font-family: monospace; font-size: 13px; color: #9ca3af; word-break: break-all; }
    .warning { background: #1c1007; border-left: 3px solid #fbbf24; padding: 12px 16px; margin: 24px 0; }
    .warning p { color: #fbbf24; font-size: 13px; margin: 0; }
    .footer { text-align: center; margin-top: 32px; }
    .footer p { color: #374151; font-size: 12px; line-height: 1.5; margin: 4px 0; }
    .divider { border: none; border-top: 1px solid #1f2937; margin: 32px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-box"><p class="logo-text">TAG</p></div>
    </div>
    <div class="card">
      <p class="title">Password Reset</p>
      <p class="subtitle">Tactical Adaptation Group — Operator Access Recovery</p>
      <p class="body-text">
        Operator <strong style="color:#4ade80">${username}</strong>, a password reset was requested for your account.
        Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
      </p>
      <a href="${link}" class="btn">Reset My Password</a>
      <p class="body-text" style="font-size:13px; color:#9ca3af;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <div class="token-box">${link}</div>
      <div class="warning">
        <p>&#9888; If you did not request this reset, ignore this email. Your password has not been changed.</p>
      </div>
    </div>
    <hr class="divider">
    <div class="footer">
      <p>Tactical Adaptation Group &nbsp;&middot;&nbsp; Automated System Message</p>
      <p>Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function twoFactorEnabledEmail(username: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background: #0a0f0a; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .logo-box { display: inline-block; background: #0f1f0f; border: 1.5px solid #4ade80; padding: 10px 20px; margin-bottom: 32px; }
    .logo-text { color: #4ade80; font-size: 22px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; margin: 0; }
    .card { background: #111827; border: 1px solid #1f2937; padding: 36px; }
    .title { color: #ffffff; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0; }
    .body-text { color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; }
    .success-box { background: #0f1f0f; border-left: 3px solid #4ade80; padding: 12px 16px; margin: 16px 0; }
    .success-box p { color: #4ade80; font-size: 13px; margin: 0; font-weight: 700; }
    .footer { text-align: center; margin-top: 32px; }
    .footer p { color: #374151; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div style="text-align:center"><div class="logo-box"><p class="logo-text">TAG</p></div></div>
    <div class="card">
      <p class="title">Two-Factor Authentication Enabled</p>
      <p class="body-text">
        Operator <strong style="color:#4ade80">${username}</strong>, two-factor authentication has been successfully enabled on your TAG account.
      </p>
      <div class="success-box"><p>&#10003; Your account is now protected with 2FA</p></div>
      <p class="body-text" style="font-size:13px; color:#9ca3af;">
        You will now be required to enter a verification code from your authenticator app each time you log in.
        If you did not enable this yourself, contact a TAG administrator immediately.
      </p>
    </div>
    <div class="footer">
      <p>Tactical Adaptation Group &nbsp;&middot;&nbsp; Automated System Message</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
