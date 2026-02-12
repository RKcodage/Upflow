"use client";

import { Code, Settings, X } from "lucide-react";

interface IntegrationHelpModalProps {
  onClose: () => void;
}

export default function IntegrationHelpModal({ onClose }: IntegrationHelpModalProps) {
  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="modal animate-scale-in"
        style={{ maxWidth: "860px" }}
        onClick={(event) => event.stopPropagation()}
      >
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
                background: "var(--color-accent-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-accent)",
              }}
            >
              <Code size={18} />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-foreground)" }}>
              Configurer le widget
            </h2>
          </div>
          <button className="btn-icon" style={{ cursor: "pointer" }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <p style={{ fontSize: "13px", color: "var(--color-muted)", marginBottom: "20px" }}>
            Clique sur{" "}
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Settings size={20} />
            </span>{" "}
            dans la barre de navigation pour définir ton <strong>projectId</strong>, les{" "}
            <strong>domaines autorisés</strong> et récupérer la clé publique si besoin.
          </p>

          <div className="flex" style={{ gap: "16px", flexWrap: "wrap" }}>
            <div className="card" style={{ flex: "1 1 280px", padding: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                En local
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-muted)", marginBottom: "12px" }}>
                Ajoute l'origine de ton site de dev (ex:{" "}
                <code style={{ color: "var(--color-foreground)" }}>http://localhost:3000</code>) dans les domaines autorisés.
              </div>
            </div>

            <div className="card" style={{ flex: "1 1 280px", padding: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                En production
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-muted)", marginBottom: "12px" }}>
                Ajoute le domaine de ton site (ex:{" "}
                <code style={{ color: "var(--color-foreground)" }}>https://ton-site.com</code>) dans les domaines autorisés.
              </div>
            </div>
          </div>

          <div style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "16px" }}>
            Si <strong>les domaines autorisés</strong> contient celui du site, tu peux omettre{" "}
            <strong>projectKey</strong>. Sinon, garde-le dans le snippet.
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "10px" }}>
            Pour tester la <strong>Démo du widget</strong>, sélectionne le projet <strong>Demo</strong> déjà disponible dans les paramètres.
          </div>
        </div>

        <div
          className="flex items-center justify-end"
          style={{ padding: "20px 24px", borderTop: "1px solid var(--color-border)" }}
        >
          <button className="btn-secondary" style={{ padding: "10px 18px", cursor: "pointer" }} onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
