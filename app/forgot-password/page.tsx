"use client";

import { useState } from "react";
import Link from "next/link";

type StatusMessage = { type: "success" | "error"; message: string } | null;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setResetUrl(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Impossible d'envoyer le lien.");
      }
      setStatus({
        type: "success",
        message: "Si un compte existe, un lien de réinitialisation a été envoyé.",
      });
      if (typeof data?.resetUrl === "string" && data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Impossible d'envoyer le lien.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "100vh", padding: "24px" }}>
      <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
          Mot de passe oublié
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-muted)", marginBottom: "24px" }}>
          Reçois un lien pour réinitialiser ton mot de passe.
        </p>

        <form className="flex flex-col" style={{ gap: "16px" }} onSubmit={handleSubmit}>
          <div>
            <label className="label" style={{ marginBottom: "8px" }}>
              Email
            </label>
            <input
              className="input"
              style={{ padding: "10px 14px" }}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {status && (
            <div
              style={{
                color: status.type === "success" ? "var(--color-success)" : "var(--color-danger)",
                fontSize: "13px",
              }}
            >
              {status.message}
            </div>
          )}

          {resetUrl && (
            <div style={{ fontSize: "13px" }}>
              Lien de reset (dev) :{" "}
              <Link href={resetUrl} style={{ color: "var(--color-foreground)" }}>
                Réinitialiser le mot de passe
              </Link>
            </div>
          )}

          <button className="btn-primary" style={{ padding: "10px 16px", cursor: "pointer" }} disabled={isLoading}>
            {isLoading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>

        <div style={{ marginTop: "16px", fontSize: "13px", color: "var(--color-muted)" }}>
          Déjà revenu ?{" "}
          <Link href="/login" style={{ color: "var(--color-foreground)" }}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
