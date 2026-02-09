"use client";

import { ChevronUp, ChevronDown, MessageCircle, Calendar, User, Trash2 } from "lucide-react";
import type { Feature } from "../page";

interface FeatureCardProps {
  feature: Feature;
  onVote: (featureId: string, voteType: "up" | "down") => void;
  onStatusChange: (featureId: string, status: Feature["status"]) => void;
  onDelete: (feature: Feature) => void;
}

export default function FeatureCard({ feature, onVote, onStatusChange, onDelete }: FeatureCardProps) {
  const getStatusBadgeClass = (status: Feature["status"]) => {
    switch (status) {
      case "planned":
        return "badge-planned";
      case "in-progress":
        return "badge-in-progress";
      case "completed":
        return "badge-completed";
      case "under-review":
        return "badge-under-review";
    }
  };

  const getStatusLabel = (status: Feature["status"]) => {
    switch (status) {
      case "planned":
        return "Planifié";
      case "in-progress":
        return "En cours";
      case "completed":
        return "Terminé";
      case "under-review":
        return "En révision";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `il y a ${diffDays} jours`;
    if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaines`;
    return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
  };

  return (
    <div className="card flex" style={{ padding: "20px", gap: "20px" }}>
      {/* Vote Section */}
      <div className="flex flex-col items-center" style={{ gap: "8px" }}>
        <button
          className={`vote-btn ${feature.userVote === "up" ? "upvoted" : ""}`}
          style={{ width: "44px", height: "44px" }}
          onClick={() => onVote(feature.id, "up")}
        >
          <ChevronUp size={20} strokeWidth={2.5} />
        </button>
        
        <div 
          style={{ 
            fontSize: "18px", 
            fontWeight: 700, 
            color: feature.userVote === "up" 
              ? "var(--color-accent)" 
              : feature.userVote === "down" 
              ? "var(--color-secondary)" 
              : "var(--color-foreground)"
          }}
        >
          {feature.votes}
        </div>
        
        <button
          className={`vote-btn ${feature.userVote === "down" ? "downvoted" : ""}`}
          style={{ width: "44px", height: "44px" }}
          onClick={() => onVote(feature.id, "down")}
        >
          <ChevronDown size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col" style={{ gap: "12px" }}>
        <div>
          <div className="flex items-start justify-between" style={{ marginBottom: "8px" }}>
            <h3 
              className="cursor-pointer" 
              style={{ 
                fontSize: "18px", 
                fontWeight: 600, 
                color: "var(--color-foreground)",
                lineHeight: "1.4"
              }}
            >
              {feature.title}
            </h3>
            
            <div className="flex items-center" style={{ gap: "8px" }}>
              <div className={`badge ${getStatusBadgeClass(feature.status)}`} style={{ padding: "4px 10px" }}>
                {getStatusLabel(feature.status)}
              </div>
              <div style={{ position: "relative", width: "160px" }}>
                <select
                  className="select"
                  value={feature.status}
                  onChange={(event) => onStatusChange(feature.id, event.target.value as Feature["status"])}
                  style={{
                    padding: "4px 28px 4px 8px",
                    fontSize: "12px",
                    height: "28px",
                    width: "100%",
                    appearance: "none",
                  }}
                >
                  <option value="under-review">En révision</option>
                  <option value="planned">Planifié</option>
                  <option value="in-progress">En cours</option>
                  <option value="completed">Terminé</option>
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "var(--color-muted)",
                  }}
                />
              </div>
              <button
                className="btn-icon"
                style={{ width: "28px", height: "28px", color: "var(--color-danger)" }}
                onClick={() => onDelete(feature)}
                aria-label="Supprimer la demande"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <p style={{ fontSize: "14px", color: "var(--color-muted)", lineHeight: "1.6" }}>
            {feature.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: "16px" }}>
            <div className="category-tag" style={{ padding: "4px 10px" }}>
              {feature.category}
            </div>

            <div className="flex items-center" style={{ gap: "6px", color: "var(--color-muted)", fontSize: "13px" }}>
              <MessageCircle size={14} />
              <span>{feature.comments} {feature.comments === 1 ? "commentaire" : "commentaires"}</span>
            </div>

            <div className="flex items-center" style={{ gap: "6px", color: "var(--color-muted)", fontSize: "13px" }}>
              <Calendar size={14} />
              <span>{formatDate(feature.date)}</span>
            </div>
          </div>

          <div className="flex items-center" style={{ gap: "8px" }}>
            <User size={14} color="var(--color-muted)" />
            <span style={{ fontSize: "13px", color: "var(--color-muted)" }}>
              {feature.author}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
