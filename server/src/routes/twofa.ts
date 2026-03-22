import { Router, type IRouter } from "express";
import QRCode from "qrcode";
import crypto from "crypto";
import { db, pool } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { sendEmail, twoFactorEnabledEmail } from "../lib/email";
import { generateSecret, totpVerify, totpKeyUri } from "../lib/totp";

const router: IRouter = Router();

function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );
}

router.get("/auth/2fa/status", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const result = await pool.query(
    "SELECT enabled FROM user_2fa WHERE user_id = $1",
    [user.id]
  );
  const row = result.rows[0] as { enabled: boolean } | undefined;
  res.json({ enabled: row?.enabled ?? false });
});

router.post("/auth/2fa/setup", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;

  const existing = await pool.query(
    "SELECT id, enabled FROM user_2fa WHERE user_id = $1",
    [user.id]
  );
  if (existing.rows.length > 0 && (existing.rows[0] as any).enabled) {
    res.status(409).json({ error: "2FA is already enabled on this account" });
    return;
  }

  const secret = generateSecret();
  const otpauthUrl = totpKeyUri(user.username, "TAG", secret);
  const qrCode = await QRCode.toDataURL(otpauthUrl);

  await pool.query(
    `INSERT INTO user_2fa (user_id, totp_secret, enabled)
     VALUES ($1, $2, false)
     ON CONFLICT (user_id) DO UPDATE SET totp_secret = $2, enabled = false, updated_at = now()`,
    [user.id, secret]
  );

  res.json({ secret, qrCode, otpauthUrl });
});

router.post("/auth/2fa/verify-setup", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { code } = req.body as { code: string };

  if (!code) {
    res.status(400).json({ error: "Verification code required" });
    return;
  }

  const result = await pool.query(
    "SELECT totp_secret FROM user_2fa WHERE user_id = $1 AND enabled = false",
    [user.id]
  );
  const row = result.rows[0] as { totp_secret: string } | undefined;

  if (!row) {
    res.status(404).json({ error: "No pending 2FA setup found. Start setup first." });
    return;
  }

  const valid = totpVerify(code.replace(/\s/g, ""), row.totp_secret);
  if (!valid) {
    res.status(400).json({ error: "Invalid code. Make sure your authenticator clock is synced." });
    return;
  }

  const backupCodes = generateBackupCodes();
  await pool.query(
    "UPDATE user_2fa SET enabled = true, backup_codes = $1, updated_at = now() WHERE user_id = $2",
    [backupCodes, user.id]
  );

  try {
    await sendEmail(
      user.email,
      "Two-Factor Authentication Enabled — TAG",
      twoFactorEnabledEmail(user.username)
    );
  } catch (e) {
    console.error("[2fa] Failed to send confirmation email:", e);
  }

  res.json({ success: true, backupCodes });
});

router.post("/auth/2fa/disable", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { code, password } = req.body as { code?: string; password?: string };

  const userRecord = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
  if (!userRecord[0]) { res.status(404).json({ error: "User not found" }); return; }

  if (!password) { res.status(400).json({ error: "Current password required" }); return; }
  const bcrypt = (await import("bcryptjs")).default;
  const passwordValid = await bcrypt.compare(password, userRecord[0].passwordHash);
  if (!passwordValid) { res.status(403).json({ error: "Incorrect password" }); return; }

  const result = await pool.query(
    "SELECT totp_secret FROM user_2fa WHERE user_id = $1 AND enabled = true",
    [user.id]
  );
  const row = result.rows[0] as { totp_secret: string } | undefined;

  if (row && code) {
    const valid = totpVerify(code.replace(/\s/g, ""), row.totp_secret);
    if (!valid) {
      const isBackup = await checkAndConsumeBackupCode(user.id, code);
      if (!isBackup) {
        res.status(400).json({ error: "Invalid authenticator code" });
        return;
      }
    }
  }

  await pool.query("DELETE FROM user_2fa WHERE user_id = $1", [user.id]);
  res.json({ success: true });
});

router.post("/auth/2fa/validate", async (req, res): Promise<void> => {
  const { userId, code } = req.body as { userId: number; code: string };

  if (!userId || !code) {
    res.status(400).json({ error: "userId and code required" });
    return;
  }

  const result = await pool.query(
    "SELECT totp_secret, backup_codes FROM user_2fa WHERE user_id = $1 AND enabled = true",
    [userId]
  );
  const row = result.rows[0] as { totp_secret: string; backup_codes: string[] } | undefined;

  if (!row) {
    res.status(404).json({ error: "2FA not enabled for this user" });
    return;
  }

  const valid = totpVerify(code.replace(/\s/g, ""), row.totp_secret);
  if (valid) {
    res.json({ valid: true });
    return;
  }

  const isBackup = await checkAndConsumeBackupCode(userId, code);
  if (isBackup) {
    res.json({ valid: true, usedBackupCode: true });
    return;
  }

  res.status(400).json({ valid: false, error: "Invalid code" });
});

router.get("/auth/2fa/backup-codes", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const result = await pool.query(
    "SELECT backup_codes FROM user_2fa WHERE user_id = $1 AND enabled = true",
    [user.id]
  );
  const row = result.rows[0] as { backup_codes: string[] } | undefined;
  if (!row) { res.status(404).json({ error: "2FA not enabled" }); return; }
  res.json({ backupCodes: row.backup_codes });
});

router.post("/auth/2fa/regenerate-backup-codes", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { password } = req.body as { password: string };

  if (!password) { res.status(400).json({ error: "Password required" }); return; }
  const userRecord = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
  if (!userRecord[0]) { res.status(404).json({ error: "User not found" }); return; }

  const bcrypt = (await import("bcryptjs")).default;
  const valid = await bcrypt.compare(password, userRecord[0].passwordHash);
  if (!valid) { res.status(403).json({ error: "Incorrect password" }); return; }

  const backupCodes = generateBackupCodes();
  await pool.query(
    "UPDATE user_2fa SET backup_codes = $1, updated_at = now() WHERE user_id = $2",
    [backupCodes, user.id]
  );
  res.json({ backupCodes });
});

async function checkAndConsumeBackupCode(userId: number, code: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT backup_codes FROM user_2fa WHERE user_id = $1 AND enabled = true",
    [userId]
  );
  const row = result.rows[0] as { backup_codes: string[] } | undefined;
  if (!row) return false;

  const normalised = code.replace(/\s/g, "").toUpperCase();
  const idx = row.backup_codes.indexOf(normalised);
  if (idx === -1) return false;

  const updated = [...row.backup_codes];
  updated.splice(idx, 1);
  await pool.query(
    "UPDATE user_2fa SET backup_codes = $1, updated_at = now() WHERE user_id = $2",
    [updated, userId]
  );
  return true;
}

export default router;
