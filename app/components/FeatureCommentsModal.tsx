"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, X } from "lucide-react";

type CommentItem = {
  id: string;
  message: string;
  authorEmail: string;
  createdAt: string | null;
};

interface FeatureCommentsModalProps {
  featureId: string;
  featureTitle: string;
  onClose: () => void;
  onCommentAdded?: () => void;
}

const formatTimestamp = (value: string | null) => {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
};

export default function FeatureCommentsModal({
  featureId,
  featureTitle,
  onClose,
  onCommentAdded,
}: FeatureCommentsModalProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commentsQuery = useQuery<CommentItem[]>({
    queryKey: ["feature-comments", featureId],
    queryFn: async () => {
      const response = await fetch(`/api/features/${featureId}/comments`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Impossible de charger les commentaires.");
      }
      return Array.isArray(data.comments) ? data.comments : [];
    },
  });

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setSubmitError("Le commentaire est vide.");
      return;
    }
    setSubmitError(null);
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/features/${featureId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Impossible d'ajouter le commentaire.");
      }
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["feature-comments", featureId] });
      queryClient.invalidateQueries({ queryKey: ["features"] });
      onCommentAdded?.();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Impossible d'ajouter le commentaire."
      );
    } finally {
      setIsSubmitting(false);
    }
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
                background: "var(--color-background-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-foreground)",
              }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-foreground)" }}>
                Commentaires
              </h2>
              <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>{featureTitle}</div>
            </div>
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

        <div style={{ padding: "24px", maxHeight: "360px", overflowY: "auto" }}>
          {commentsQuery.isLoading ? (
            <div style={{ color: "var(--color-muted)", fontSize: "13px" }}>Chargement...</div>
          ) : commentsQuery.isError ? (
            <div style={{ color: "var(--color-danger)", fontSize: "13px" }}>
              Impossible de charger les commentaires.
            </div>
          ) : commentsQuery.data?.length ? (
            <div className="flex flex-col" style={{ gap: "12px" }}>
              {commentsQuery.data.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    background: "var(--color-background-secondary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div className="flex items-center justify-between" style={{ gap: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>
                      {comment.authorEmail}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>
                      {formatTimestamp(comment.createdAt)}
                    </span>
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--color-foreground)" }}>
                    {comment.message}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--color-muted)", fontSize: "13px" }}>
              Aucun commentaire pour le moment.
            </div>
          )}
        </div>

        <div style={{ padding: "0 24px 24px" }}>
          <label className="label" style={{ marginBottom: "8px" }}>
            Ajouter un commentaire
          </label>
          <textarea
            className="textarea"
            style={{ padding: "10px 14px", minHeight: "110px" }}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={isSubmitting}
            placeholder="Votre commentaire..."
          />
          {submitError && (
            <div style={{ color: "var(--color-danger)", fontSize: "12px", marginTop: "8px" }}>
              {submitError}
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
            Fermer
          </button>
          <button
            className="btn-primary"
            style={{ padding: "10px 18px", cursor: "pointer" }}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Envoi..." : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}
