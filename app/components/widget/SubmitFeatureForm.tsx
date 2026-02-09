"use client";

import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";

interface SubmitFeatureFormProps {
  onSubmit: (title: string, description: string, category: string) => void;
  onCancel: () => void;
}

export default function SubmitFeatureForm({ onSubmit, onCancel }: SubmitFeatureFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Fonctionnalités");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      onSubmit(title.trim(), description.trim(), category);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <button
        className="btn-ghost flex items-center"
        style={{ padding: "8px 12px", gap: "6px", marginBottom: "20px" }}
        onClick={onCancel}
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: "20px" }}>
        <div>
          <label className="label" style={{ marginBottom: "8px" }}>
            Titre de la fonctionnalité *
          </label>
          <input
            type="text"
            className="input"
            style={{ padding: "10px 14px", fontSize: "14px" }}
            placeholder="Ex. : bouton de mode sombre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="label" style={{ marginBottom: "8px" }}>
            Description *
          </label>
          <textarea
            className="textarea"
            style={{ padding: "10px 14px", fontSize: "14px", minHeight: "120px" }}
            placeholder="Décrivez la fonctionnalité et pourquoi elle serait utile…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" style={{ marginBottom: "8px" }}>
            Catégorie
          </label>
          <select
            className="select"
            style={{ padding: "10px 14px", fontSize: "14px" }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Fonctionnalités">Fonctionnalités</option>
            <option value="UI/UX">UI/UX</option>
            <option value="Intégration">Intégration</option>
            <option value="Productivité">Productivité</option>
            <option value="Plateforme">Plateforme</option>
            <option value="Sécurité">Sécurité</option>
          </select>
        </div>

        <div
          style={{
            background: "var(--color-accent-light)",
            border: "1px solid var(--color-accent)",
            borderRadius: "8px",
            padding: "12px 14px",
            fontSize: "12px",
            color: "var(--color-accent)",
          lineHeight: "1.5",
        }}
      >
          💡 <strong>Astuce :</strong> Soyez précis et expliquez le problème que cette fonctionnalité résoudrait
        </div>

        <button
          type="submit"
          className="btn-primary flex items-center cursor-pointer"
          style={{ padding: "12px", gap: "8px", justifyContent: "center" }}
          disabled={!title.trim() || !description.trim()}
        >
          <Send size={18} />
          Envoyer la demande
        </button>
      </form>
    </div>
  );
}
