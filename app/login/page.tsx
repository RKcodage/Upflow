"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Connexion impossible.");
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "100vh", padding: "24px" }}>
      <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
          Connexion
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-muted)", marginBottom: "24px" }}>
          Accède au dashboard UpFlow.
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
          <div>
            <label className="label" style={{ marginBottom: "8px" }}>
              Mot de passe
            </label>
            <input
              className="input"
              style={{ padding: "10px 14px" }}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <div style={{ marginTop: "6px", fontSize: "12px", textAlign: "right" }}>
              <Link href="/forgot-password" style={{ color: "var(--color-foreground)" }}>
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          {error && (
            <div style={{ color: "var(--color-danger)", fontSize: "13px" }}>{error}</div>
          )}

          <button className="btn-primary" style={{ padding: "10px 16px", cursor: "pointer" }} disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div style={{ marginTop: "16px", fontSize: "13px", color: "var(--color-muted)" }}>
          Pas encore de compte ?{" "}
          <Link href="/signup" style={{ color: "var(--color-foreground)" }}>
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
