"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Inscription impossible.");
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "100vh", padding: "24px" }}>
      <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
          Créer un compte
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-muted)", marginBottom: "24px" }}>
          Démarre ton espace admin UpFlow.
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
              Mot de passe (8 caractères min.)
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

          {error && (
            <div style={{ color: "var(--color-danger)", fontSize: "13px" }}>{error}</div>
          )}

          <button className="btn-primary" style={{ padding: "10px 16px", cursor: "pointer" }} disabled={isLoading}>
            {isLoading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <div style={{ marginTop: "16px", fontSize: "13px", color: "var(--color-muted)" }}>
          Déjà un compte ?{" "}
          <Link href="/login" style={{ color: "var(--color-foreground)", cursor: "pointer", textDecoration: "underline" }}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
