"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface ChangePasswordModalProps {
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (currentPassword: string, nextPassword: string, confirmPassword: string) => void;
}

export default function ChangePasswordModal({
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError ?? error;

  const handleSubmit = () => {
    setLocalError(null);
    if (!currentPassword || !nextPassword || !confirmPassword) {
      setLocalError("Tous les champs sont requis.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      setLocalError("La confirmation ne correspond pas.");
      return;
    }
    onConfirm(currentPassword, nextPassword, confirmPassword);
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal animate-scale-in" onClick={(event) => event.stopPropagation()}>
        <div
          className="flex items-center justify-between"
          style={{ padding: "24px", borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center" style={{ gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--color-danger-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-danger)",
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-foreground)" }}>
              Modifier le mot de passe
            </h2>
          </div>
          <button
            className="btn-icon"
            style={{ cursor: "pointer" }}
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <div className="flex flex-col" style={{ gap: "16px" }}>
            <div>
              <label className="label" style={{ marginBottom: "8px" }}>
                Mot de passe actuel
              </label>
              <input
                className="input"
                style={{ padding: "10px 14px" }}
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="label" style={{ marginBottom: "8px" }}>
                Nouveau mot de passe
              </label>
              <input
                className="input"
                style={{ padding: "10px 14px" }}
                type="password"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="label" style={{ marginBottom: "8px" }}>
                Confirmation du nouveau mot de passe
              </label>
              <input
                className="input"
                style={{ padding: "10px 14px" }}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {displayError && (
            <div style={{ color: "var(--color-danger)", fontSize: "13px", marginTop: "12px" }}>
              {displayError}
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-end"
          style={{ padding: "20px 24px", borderTop: "1px solid var(--color-border)", gap: "12px" }}
        >
          <button
            className="btn-secondary"
            style={{ padding: "10px 18px", cursor: "pointer" }}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            className="btn-primary"
            style={{ padding: "10px 18px", cursor: "pointer" }}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
          </button>
        </div>
      </div>
    </div>
  );
}
