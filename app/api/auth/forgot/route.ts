import { NextResponse, type NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/lib/models/User";
import { createPasswordResetToken } from "@/lib/auth";

const isValidEmail = (value: string) => value.includes("@") && value.includes(".");

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const portValue = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  const secure =
    process.env.SMTP_SECURE === "true" ||
    (typeof portValue === "string" && Number(portValue) === 465);

  const port = portValue ? Number(portValue) : NaN;

  if (!host || !user || !pass || !from || !Number.isFinite(port)) {
    throw new Error("SMTP configuration manquante ou invalide.");
  }

  return { host, port, user, pass, from, secure };
};

const sendResetEmail = async (to: string, resetUrl: string) => {
  const { host, port, user, pass, from, secure } = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const subject = "Réinitialiser votre mot de passe UpFlow";
  const text = [
    "Bonjour,",
    "Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte UpFlow.",
    "Ce lien est valable 30 minutes.",
    `Réinitialiser le mot de passe : ${resetUrl}`,
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
  ].join("\n\n");

  const html = `
    <div style="background:#f7f7fb;padding:32px;font-family:Arial,Helvetica,sans-serif;color:#1f2430;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6e8f0;">
        <div style="font-size:24px;font-weight:700;margin-bottom:12px;color:#6b59d7;">UpFlow</div>
        <h1 style="font-size:20px;margin:0 0 12px;">Réinitialiser votre mot de passe</h1>
        <p style="margin:0 0 16px;line-height:1.5;">
          Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.
          Ce lien est valable <strong>30 minutes</strong>.
        </p>
        <div style="margin:24px 0;">
          <a href="${resetUrl}" style="background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:600;">
            Réinitialiser le mot de passe
          </a>
        </div>
        <p style="margin:0 0 8px;line-height:1.5;color:#4b5563;">
          Si le bouton ne fonctionne pas, copiez-collez ce lien :
        </p>
        <p style="margin:0 0 20px;line-height:1.5;word-break:break-all;">
          <a href="${resetUrl}" style="color:#111827;">${resetUrl}</a>
        </p>
        <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({ from, to, subject, text, html });
};

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }

    const user = await UserModel.findOne({ email });
    let resetUrl: string | null = null;

    if (user) {
      const { token, tokenHash, expiresAt } = createPasswordResetToken();
      user.resetTokenHash = tokenHash;
      user.resetTokenExpires = expiresAt;
      await user.save();
      resetUrl = `${request.nextUrl.origin}/reset-password?token=${token}`;
      await sendResetEmail(email, resetUrl);
    }

    const responseBody: { ok: true; resetUrl?: string | null } = { ok: true };
    if (process.env.NODE_ENV !== "production") {
      responseBody.resetUrl = resetUrl;
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
