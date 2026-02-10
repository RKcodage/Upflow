"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import DeleteProjectModal from "./DeleteProjectModal";

type Project = {
  projectId: string;
  name: string;
  publicKey: string;
  allowedOrigins: string[];
};

interface ProjectSettingsModalProps {
  onClose: () => void;
}

const NEW_PROJECT = "__new__";
const STORAGE_PROJECT_ID = "upflow-admin-project-id";
const STORAGE_PROJECT_KEY = "upflow-admin-project-key";

const formatOrigins = (origins: string[]) => origins.join("\n");

export default function ProjectSettingsModal({ onClose }: ProjectSettingsModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState(NEW_PROJECT);
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [allowedOrigins, setAllowedOrigins] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isNew = selectedProject === NEW_PROJECT;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const htmlSnippet = useMemo(() => {
    if (!projectId || !baseUrl) return "";
    return `<script src=\"${baseUrl}/upflow-widget.js\"></script>\n<script>\n  UpFlow.init({\n    projectId: \"${projectId}\",\n    // projectKey: \"${publicKey || "pk_xxx"}\",\n  });\n</script>`;
  }, [projectId, publicKey, baseUrl]);

  const nextSnippet = useMemo(() => {
    if (!projectId || !baseUrl) return "";
    return `// app/components/UpflowScript.tsx\n\"use client\";\n\nimport { useEffect } from \"react\";\n\nexport default function UpflowScript() {\n  useEffect(() => {\n    const script = document.createElement(\"script\");\n    script.src = \"${baseUrl}/upflow-widget.js\";\n    script.onload = () => {\n      window.UpFlow?.init({ projectId: \"${projectId}\" });\n    };\n    document.body.appendChild(script);\n  }, []);\n\n  return null;\n}\n\n// app/layout.tsx\n// import UpflowScript from \"./components/UpflowScript\";\n// ...\n// <UpflowScript />`;
  }, [projectId, baseUrl]);

  const typesSnippet = useMemo(() => {
    return `// types/upflow.d.ts\nexport {};\n\ndeclare global {\n  interface Window {\n    UpFlow?: {\n      init: (config: {\n        projectId: string;\n        projectKey?: string;\n        baseUrl?: string;\n        position?: \"bottom-right\" | \"bottom-left\";\n        theme?: \"dark\" | \"light\";\n        accent?: string;\n      }) => void;\n      open: () => void;\n      close: () => void;\n      destroy: () => void;\n    };\n  }\n}\n`;
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Impossible de charger les projets");
      }
      const items = Array.isArray(data.projects) ? data.projects : [];
      setProjects(items);
      if (items.length && selectedProject === NEW_PROJECT) {
        setSelectedProject(items[0].projectId);
      }
    } catch (error) {
      setToast({ type: "error", message: "Impossible de charger les projets" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject === NEW_PROJECT) {
      setProjectId("");
      setName("");
      setAllowedOrigins("");
      setPublicKey("");
      return;
    }

    const project = projects.find((item) => item.projectId === selectedProject);
    if (!project) return;

    setProjectId(project.projectId);
    setName(project.name ?? "");
    setAllowedOrigins(formatOrigins(project.allowedOrigins ?? []));
    setPublicKey(project.publicKey ?? "");

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_PROJECT_ID, project.projectId);
      if (project.publicKey) {
        window.localStorage.setItem(STORAGE_PROJECT_KEY, project.publicKey);
      } else {
        window.localStorage.removeItem(STORAGE_PROJECT_KEY);
      }
      window.dispatchEvent(new Event("upflow:project-change"));
    }
  }, [projects, selectedProject]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleCopy = async (value: string, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setToast({ type: "success", message: `${label} copié` });
    } catch (error) {
      setToast({ type: "error", message: `Impossible de copier ${label}` });
    }
  };

  const handleSave = async () => {
    const trimmedId = projectId.trim();
    if (!trimmedId) {
      setToast({ type: "error", message: "Le projectId est requis" });
      return;
    }

    try {
      setIsSaving(true);
      const payload: { projectId: string; name: string; allowedOrigins?: string } = {
        projectId: trimmedId,
        name: name.trim(),
      };
      if (!isProtectedDemoProject) {
        payload.allowedOrigins = allowedOrigins;
      }

      const response = await fetch(
        isNew ? "/api/projects" : `/api/projects/${encodeURIComponent(selectedProject)}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur inconnue");
      }

      const saved = data.project as Project;
      const nextProjects = isNew
        ? [saved, ...projects]
        : projects.map((item) => (item.projectId === saved.projectId ? saved : item));

      setProjects(nextProjects);
      setSelectedProject(saved.projectId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_PROJECT_ID, saved.projectId);
        if (saved.publicKey) {
          window.localStorage.setItem(STORAGE_PROJECT_KEY, saved.publicKey);
        } else {
          window.localStorage.removeItem(STORAGE_PROJECT_KEY);
        }
        window.dispatchEvent(new Event("upflow:project-change"));
        window.dispatchEvent(new Event("upflow:widget-check"));
      }
      setToast({ type: "success", message: "Projet sauvegardé" });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Erreur" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/projects/${encodeURIComponent(selectedProject)}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Erreur inconnue");
      }

      const nextProjects = projects.filter((item) => item.projectId !== selectedProject);
      setProjects(nextProjects);

      const nextSelected = nextProjects[0]?.projectId ?? NEW_PROJECT;
      setSelectedProject(nextSelected);

      if (typeof window !== "undefined") {
        const storedProjectId = window.localStorage.getItem(STORAGE_PROJECT_ID);
        if (storedProjectId === selectedProject) {
          if (nextSelected !== NEW_PROJECT) {
            window.localStorage.setItem(STORAGE_PROJECT_ID, nextSelected);
            const nextKey = nextProjects.find((item) => item.projectId === nextSelected)?.publicKey ?? "";
            if (nextKey) {
              window.localStorage.setItem(STORAGE_PROJECT_KEY, nextKey);
            } else {
              window.localStorage.removeItem(STORAGE_PROJECT_KEY);
            }
          } else {
            window.localStorage.removeItem(STORAGE_PROJECT_ID);
            window.localStorage.removeItem(STORAGE_PROJECT_KEY);
          }
          window.dispatchEvent(new Event("upflow:project-change"));
          window.dispatchEvent(new Event("upflow:widget-check"));
        }
      }

      setToast({ type: "success", message: "Projet supprimé" });
      setIsDeleteModalOpen(false);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Erreur" });
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedProjectInfo = useMemo(
    () => projects.find((item) => item.projectId === selectedProject),
    [projects, selectedProject]
  );

  const selectedProjectLabel = useMemo(() => {
    const project = selectedProjectInfo;
    if (!project) return selectedProject || "projet";
    return project.name ? `${project.name} (${project.projectId})` : project.projectId;
  }, [selectedProjectInfo, selectedProject]);

  const isProtectedDemoProject =
    selectedProjectInfo?.projectId === "demo" ||
    selectedProjectInfo?.name?.toLowerCase() === "demo";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal animate-scale-in"
        style={{ maxWidth: "720px" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "24px", borderBottom: "1px solid var(--color-border)" }}
        >
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-foreground)" }}>
              Projets & domaines autorisés
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "4px" }}>
              Autorise les sites à utiliser le widget sans clé.
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {isLoading ? (
            <div style={{ color: "var(--color-muted)", fontSize: "14px" }}>Chargement...</div>
          ) : (
            <div className="flex flex-col" style={{ gap: "18px" }}>
              <div>
                <label className="label" style={{ marginBottom: "8px" }}>
                  Projet
                </label>
                <div className="flex items-center" style={{ gap: "12px" }}>
                  <select
                    className="select"
                    value={selectedProject}
                    onChange={(event) => setSelectedProject(event.target.value)}
                    style={{ flex: 1, padding: "10px 14px" }}
                  >
                    <option value={NEW_PROJECT}>+ Nouveau projet</option>
                    {projects.map((project) => (
                      <option key={project.projectId} value={project.projectId}>
                        {project.name ? `${project.name} (${project.projectId})` : project.projectId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex" style={{ gap: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 240px" }}>
                  <label className="label" style={{ marginBottom: "8px" }}>
                    projectId
                  </label>
                  <input
                    className="input"
                    style={{ padding: "10px 14px" }}
                    placeholder="ex: demo"
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    disabled={!isNew}
                  />
                </div>

                <div style={{ flex: "1 1 240px" }}>
                  <label className="label" style={{ marginBottom: "8px" }}>
                    Nom
                  </label>
                  <input
                    className="input"
                    style={{ padding: "10px 14px" }}
                    placeholder="ex: Site marketing"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label" style={{ marginBottom: "8px" }}>
                  Domaines autorisés (1 par ligne)
                </label>
                <textarea
                  className="textarea"
                  style={{ padding: "10px 14px", minHeight: "120px" }}
                  placeholder="http://localhost:3000\nhttps://example.com"
                  value={allowedOrigins}
                  onChange={(event) => setAllowedOrigins(event.target.value)}
                  disabled={isProtectedDemoProject}
                />
                <div style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "6px" }}>
                  {isProtectedDemoProject
                    ? "Les domaines du projet Demo sont verrouillés."
                    : "Le domaine doit correspondre exactement (protocole + port)."}
                </div>
              </div>

              {!isNew && (
                <div>
                  <label className="label" style={{ marginBottom: "8px" }}>
                    Clé publique (optionnelle)
                  </label>
                  <div className="flex items-center" style={{ gap: "12px" }}>
                    <input
                      className="input"
                      style={{ padding: "10px 14px" }}
                      value={publicKey}
                      readOnly
                    />
                    <button
                      className="btn-secondary"
                      style={{ padding: "10px 14px" }}
                      onClick={() => handleCopy(publicKey, "Clé")}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              )}

              {htmlSnippet && (
                <div>
                  <label className="label" style={{ marginBottom: "8px" }}>
                    Snippet HTML
                  </label>
                  <div className="card" style={{ padding: "14px" }}>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        fontSize: "12px",
                        color: "var(--color-foreground)",
                        margin: 0,
                      }}
                    >
                      {htmlSnippet}
                    </pre>
                  </div>
                  <button
                    className="btn-ghost"
                    style={{ marginTop: "8px", padding: "6px 10px", cursor: "pointer" }}
                    onClick={() => handleCopy(htmlSnippet, "Snippet HTML")}
                  >
                    Copier le snippet
                  </button>
                </div>
              )}

              {nextSnippet && (
                <div>
                  <label className="label" style={{ marginBottom: "8px" }}>
                    Snippet Next.js (App Router + TypeScript)
                  </label>
                  <div className="card" style={{ padding: "14px" }}>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        fontSize: "12px",
                        color: "var(--color-foreground)",
                        margin: 0,
                      }}
                    >
                      {nextSnippet}
                    </pre>
                  </div>
                  <button
                    className="btn-ghost"
                    style={{ marginTop: "8px", padding: "6px 10px", cursor: "pointer" }}
                    onClick={() => handleCopy(nextSnippet, "Snippet Next.js")}
                  >
                    Copier le snippet
                  </button>
                </div>
              )}

              <div>
                <label className="label" style={{ marginBottom: "8px" }}>
                  Déclaration TypeScript (window.UpFlow)
                </label>
                <div className="card" style={{ padding: "14px" }}>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      fontSize: "12px",
                      color: "var(--color-foreground)",
                      margin: 0,
                    }}
                  >
                    {typesSnippet}
                  </pre>
                </div>
                <button
                  className="btn-ghost"
                  style={{ marginTop: "8px", padding: "6px 10px", cursor: "pointer" }}
                  onClick={() => handleCopy(typesSnippet, "Snippet TypeScript")}
                >
                  Copier le snippet
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-between"
          style={{ padding: "20px 24px", borderTop: "1px solid var(--color-border)", gap: "12px" }}
        >
          <div>
            {!isNew && !isProtectedDemoProject && (
              <button
                className="btn-secondary"
                style={{
                  padding: "10px 18px",
                  cursor: "pointer",
                  background: "var(--color-danger-bg)",
                  borderColor: "var(--color-danger)",
                  color: "var(--color-danger)",
                }}
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            )}
          </div>
          <div className="flex items-center" style={{ gap: "12px" }}>
            <button className="btn-secondary" style={{ padding: "10px 18px", cursor: "pointer" }} onClick={onClose}>
              Fermer
            </button>
            <button
              className="btn-primary"
              style={{ padding: "10px 18px", cursor: "pointer" }}
              onClick={handleSave}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </div>
      </div>

      {isDeleteModalOpen && !isNew && !isProtectedDemoProject && (
        <DeleteProjectModal
          projectLabel={selectedProjectLabel}
          isDeleting={isDeleting}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
        />
      )}

      {toast && (
        <div
          className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}
          style={{ padding: "14px 18px", gap: "10px" }}
        >
          <Check size={18} />
          <span style={{ fontSize: "13px", fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
