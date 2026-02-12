"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ChangePasswordModal from "../components/ChangePasswordModal";
import DeleteAccountModal from "../components/DeleteAccountModal";

type AuthUser = {
  id: string;
  email: string;
};

type StatusMessage = { type: "success" | "error"; message: string } | null;

const STORAGE_PROJECT_ID = "upflow-admin-project-id";
const STORAGE_PROJECT_KEY = "upflow-admin-project-key";

const getStorageKeys = (userId: string) => ({
  projectId: `${STORAGE_PROJECT_ID}:${userId}`,
  projectKey: `${STORAGE_PROJECT_KEY}:${userId}`,
});

export default function ProfilePage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<StatusMessage>(null);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<StatusMessage>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          router.push("/login");
          return;
        }
        const data = await response.json();
        if (active) {
          setAuthUser(data?.user ?? null);
          setEmail(data?.user?.email ?? "");
        }
      } catch (error) {
        router.push("/login");
      } finally {
        if (active) setAuthChecked(true);
      }
    };

    void checkAuth();
    return () => {
      active = false;
    };
  }, [router]);

  const handleEmailSave = async () => {
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail) {
      setEmailStatus({ type: "error", message: "Email requis." });
      return;
    }

    try {
      setIsSavingEmail(true);
      setEmailStatus(null);
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Impossible de mettre à jour l'email.");
      }
      setAuthUser(data.user);
      setEmail(data.user.email);
      setEmailStatus({ type: "success", message: "Email mis à jour." });
    } catch (error) {
      setEmailStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Impossible de mettre à jour l'email.",
      });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handlePasswordChange = async (
    currentPassword: string,
    nextPassword: string,
    confirmPassword: string
  ) => {
    setPasswordError(null);
    setPasswordStatus(null);

    if (!currentPassword || !nextPassword || !confirmPassword) {
      setPasswordError("Tous les champs sont requis.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      setPasswordError("La confirmation ne correspond pas.");
      return;
    }
    if (nextPassword.length < 8) {
      setPasswordError("Mot de passe trop court (8 caractères min).");
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, nextPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Impossible de modifier le mot de passe.");
      }
      setIsPasswordModalOpen(false);
      setPasswordStatus({ type: "success", message: "Mot de passe mis à jour." });
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Impossible de modifier le mot de passe."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const clearPasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordError(null);
  };

  const handleDeleteAccount = async () => {
    if (!authUser) return;
    setDeleteError(null);
    try {
      setIsDeletingAccount(true);
      const response = await fetch("/api/auth/account", { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Impossible de supprimer le compte.");
      }
      if (typeof window !== "undefined") {
        const storageKeys = getStorageKeys(authUser.id);
        window.localStorage.removeItem(storageKeys.projectId);
        window.localStorage.removeItem(storageKeys.projectKey);
      }
      router.push("/signup");
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Impossible de supprimer le compte."
      );
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div style={{ color: "var(--color-muted)" }}>Chargement...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div style={{ color: "var(--color-muted)" }}>Redirection...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "100vh", padding: "24px" }}>
      <div className="card" style={{ width: "100%", maxWidth: "520px", padding: "28px" }}>
        <div className="flex items-start justify-between" style={{ gap: "16px", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "6px" }}>Profil</h1>
            <p style={{ fontSize: "13px", color: "var(--color-muted)" }}>
              Modifie ton email et ton mot de passe.
            </p>
          </div>
          <Link href="/" className="btn-ghost" style={{ padding: "8px 12px", textDecoration: "none" }}>
            Retour
          </Link>
        </div>

        <div className="flex flex-col" style={{ gap: "18px" }}>
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
              disabled={isSavingEmail}
            />
          </div>

          {emailStatus && (
            <div
              style={{
                fontSize: "13px",
                color: emailStatus.type === "success" ? "var(--color-success)" : "var(--color-danger)",
              }}
            >
              {emailStatus.message}
            </div>
          )}

          <div className="flex items-center" style={{ gap: "12px" }}>
            <button
              className="btn-primary"
              style={{ padding: "10px 16px", cursor: "pointer" }}
              onClick={handleEmailSave}
              disabled={isSavingEmail}
            >
              {isSavingEmail ? "Sauvegarde..." : "Sauvegarder l'email"}
            </button>
            <button
              className="btn-secondary"
              style={{ padding: "10px 16px", cursor: "pointer" }}
              onClick={() => {
                setPasswordStatus(null);
                setPasswordError(null);
                setIsPasswordModalOpen(true);
              }}
            >
              Modifier le mot de passe
            </button>
          </div>

          {passwordStatus && (
            <div style={{ fontSize: "13px", color: "var(--color-success)" }}>
              {passwordStatus.message}
            </div>
          )}

          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-danger)", marginBottom: "6px" }}>
              Zone dangereuse
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-muted)", marginBottom: "12px" }}>
              Supprime définitivement ton compte et toutes les données associées.
            </div>
            <button
              className="btn-secondary"
              style={{ padding: "10px 16px", background: "var(--color-danger)", cursor: "pointer" }}
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isDeletingAccount}
            >
              Supprimer mon compte
            </button>
            {deleteError && (
              <div style={{ color: "var(--color-danger)", fontSize: "13px", marginTop: "10px" }}>
                {deleteError}
              </div>
            )}
          </div>
        </div>
      </div>

      {isPasswordModalOpen && (
        <ChangePasswordModal
          isSubmitting={isChangingPassword}
          error={passwordError}
          onClose={clearPasswordModal}
          onConfirm={handlePasswordChange}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteAccountModal
          isDeleting={isDeletingAccount}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  );
}
