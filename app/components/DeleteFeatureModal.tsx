"use client";

import { X, AlertTriangle } from "lucide-react";

interface DeleteFeatureModalProps {
  featureTitle: string;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteFeatureModal({
  featureTitle,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteFeatureModalProps) {
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
              Confirmer la suppression
            </h2>
          </div>
          <button
            className="btn-icon"
            style={{ cursor: "pointer" }}
            onClick={onClose}
            disabled={isDeleting}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px", color: "var(--color-muted)", fontSize: "14px", lineHeight: "1.6" }}>
          Tu es sur le point de supprimer{" "}
          <span style={{ color: "var(--color-foreground)", fontWeight: 600 }}>
            "{featureTitle}"
          </span>
          . Cette action est definitive.
        </div>

        <div
          className="flex items-center justify-end"
          style={{ padding: "20px 24px", borderTop: "1px solid var(--color-border)", gap: "12px" }}
        >
          <button
            className="btn-secondary"
            style={{ padding: "10px 18px", cursor: "pointer" }}
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </button>
          <button
            className="btn-primary"
            style={{ padding: "10px 18px", background: "var(--color-danger)", cursor: "pointer" }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
