"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type StatusMessage = { type: "success" | "error"; message: string } | null;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!token) {
      setStatus({ type: "error", message: "Lien invalide ou incomplet." });
      return;
    }
    if (!password || !confirmPassword) {
      setStatus({ type: "error", message: "Tous les champs sont requis." });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "La confirmation ne correspond pas." });
      return;
    }
    if (password.length < 8) {
      setStatus({ type: "error", message: "Mot de passe trop court (8 caractères min)." });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Réinitialisation impossible.");
      }
      setIsDone(true);
      setStatus({ type: "success", message: "Mot de passe mis à jour." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Réinitialisation impossible.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "100vh", padding: "24px" }}>
      <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
          Réinitialiser le mot de passe
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-muted)", marginBottom: "24px" }}>
          Choisis un nouveau mot de passe.
        </p>

        {!isDone ? (
          <form className="flex flex-col" style={{ gap: "16px" }} onSubmit={handleSubmit}>
            <div>
              <label className="label" style={{ marginBottom: "8px" }}>
                Nouveau mot de passe
              </label>
              <input
                className="input"
                style={{ padding: "10px 14px" }}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" style={{ marginBottom: "8px" }}>
                Confirmation
              </label>
              <input
                className="input"
                style={{ padding: "10px 14px" }}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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

            <button className="btn-primary" style={{ padding: "10px 16px", cursor: "pointer" }} disabled={isLoading}>
              {isLoading ? "Sauvegarde..." : "Mettre à jour"}
            </button>
          </form>
        ) : (
          <div>
            {status && (
              <div style={{ color: "var(--color-success)", fontSize: "13px", marginBottom: "16px" }}>
                {status.message}
              </div>
            )}
            <Link href="/login" className="btn-primary" style={{ padding: "10px 16px", display: "inline-block" }}>
              Retour à la connexion
            </Link>
          </div>
        )}

        {!token && !isDone && (
          <div style={{ marginTop: "16px", fontSize: "13px", color: "var(--color-danger)" }}>
            Lien invalide. Demande un nouveau lien de réinitialisation.
          </div>
        )}

        <div style={{ marginTop: "16px", fontSize: "13px", color: "var(--color-muted)" }}>
          Besoin d'un nouveau lien ?{" "}
          <Link href="/forgot-password" style={{ color: "var(--color-foreground)" }}>
            Mot de passe oublié
          </Link>
        </div>
      </div>
    </div>
  );
}
