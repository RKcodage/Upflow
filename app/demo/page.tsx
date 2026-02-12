/**
 * UpFlow Widget Demo - Public View
 * This shows how the voting widget appears on a client's website
 * 
 * Features:
 * - Floating trigger button (like Intercom)
 * - Slide-in panel from the right
 * - Compact feature list with voting
 * - Quick feature submission
 * - Mobile responsive
 */

"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import VoteWidget from "../components/widget/VoteWidget";

const STORAGE_PROJECT_ID = "upflow-admin-project-id";
const STORAGE_PROJECT_KEY = "upflow-admin-project-key";

type ProjectItem = {
  projectId?: string;
  name?: string;
  publicKey?: string;
};

const getStorageKeys = (userId: string) => ({
  projectId: `${STORAGE_PROJECT_ID}:${userId}`,
  projectKey: `${STORAGE_PROJECT_KEY}:${userId}`,
});

function WidgetDemoContent() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const searchParams = useSearchParams();
  const [projectId, setProjectId] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        if (isMounted.current) setAuthUserId(null);
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (isMounted.current) {
        setAuthUserId(typeof data?.user?.id === "string" ? data.user.id : null);
      }
    } catch {
      if (isMounted.current) setAuthUserId(null);
    } finally {
      if (isMounted.current) setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    void loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFocus = () => {
      void loadAuth();
    };
    const handleVisibility = () => {
      if (!document.hidden) {
        void loadAuth();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadAuth]);

  useEffect(() => {
    const queryProjectId = searchParams.get("projectId")?.trim() ?? "";
    const queryProjectKey = searchParams.get("projectKey")?.trim() ?? "";
    if (queryProjectId) {
      setProjectId(queryProjectId);
      setProjectKey(queryProjectKey);
      return;
    }

    if (authUserId && typeof window !== "undefined") {
      const storageKeys = getStorageKeys(authUserId);
      const storedId = window.localStorage.getItem(storageKeys.projectId) ?? "";
      const storedKey = window.localStorage.getItem(storageKeys.projectKey) ?? "";
      if (storedId) {
        setProjectId(storedId);
        setProjectKey(storedKey);
        return;
      }
    }

    if (authUserId) {
      const loadProjects = async () => {
        try {
          const response = await fetch("/api/projects", { cache: "no-store" });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) return;
          const items: ProjectItem[] = Array.isArray(data.projects) ? data.projects : [];
          const demoProject = items.find(
            (item: ProjectItem) =>
              typeof item?.name === "string" && item.name.toLowerCase() === "demo"
          );
          const selected = demoProject ?? items[0];
          if (!selected?.projectId) return;
          setProjectId(selected.projectId);
          setProjectKey((selected.publicKey ?? "").trim());
          if (typeof window !== "undefined") {
            const storageKeys = getStorageKeys(authUserId);
            window.localStorage.setItem(storageKeys.projectId, selected.projectId);
            if (selected.publicKey) {
              window.localStorage.setItem(storageKeys.projectKey, selected.publicKey);
            } else {
              window.localStorage.removeItem(storageKeys.projectKey);
            }
          }
        } catch {
          // ignore
        }
      };

      void loadProjects();
      return;
    }

    if (authChecked && !authUserId) {
      setProjectId(process.env.NEXT_PUBLIC_UPFLOW_DEMO_PROJECT_ID ?? "demo");
      setProjectKey(process.env.NEXT_PUBLIC_UPFLOW_DEMO_PROJECT_KEY ?? "");
    }
  }, [searchParams, authUserId, authChecked]);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      {/* Demo Website Content */}
      <nav 
        style={{ 
          height: "70px",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
            UpFlow Démo
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link
            href="/"
            style={{
              color: "#111827",
              textDecoration: "none",
              fontWeight: 600,
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "#ffffff",
            }}
          >
            Dashboard
          </Link>
          <a href="#" style={{ color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>Fonctionnalités</a>
          <a href="#" style={{ color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>Tarifs</a>
          <a href="#" style={{ color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>À propos</a>
          <button 
            style={{ 
              background: "var(--color-accent)",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Commencer
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ padding: "80px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1 
            style={{ 
              fontSize: "56px", 
              fontWeight: 800, 
              color: "#111827",
              marginBottom: "20px",
              lineHeight: "1.2"
            }}
          >
            Créez de meilleurs produits
            <br />
            <span style={{ color: "var(--color-accent)" }}>Avec votre communauté</span>
          </h1>
          <p 
            style={{ 
              fontSize: "20px", 
              color: "#6b7280",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: "1.6"
            }}
          >
            Ceci est un site de démonstration montrant comment UpFlow s’intègre naturellement à votre produit
          </p>
        </div>

        <div 
          style={{ 
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "32px",
            marginTop: "80px"
          }}
        >
          {[
            { emoji: "⚡", title: "Ultra rapide", desc: "Conçu pour la vitesse et les performances" },
            { emoji: "🎨", title: "Design soigné", desc: "Une interface raffinée que les utilisateurs adorent" },
            { emoji: "🔒", title: "Sécurisé par défaut", desc: "Sécurité de niveau entreprise" },
          ].map((feature, i) => (
            <div
              key={i}
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "32px",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>{feature.emoji}</div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: "1.6" }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* More realistic website content */}
        <div style={{ marginTop: "120px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              Adopté par plus de 10&nbsp;000 équipes
            </h2>
            <p style={{ fontSize: "18px", color: "#6b7280" }}>
              Rejoignez les entreprises qui créent de meilleurs produits
            </p>
          </div>

          {/* Testimonial */}
          <div 
            style={{ 
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "20px",
              padding: "48px",
              maxWidth: "800px",
              margin: "0 auto"
            }}
          >
            <p style={{ fontSize: "20px", color: "#111827", lineHeight: "1.7", marginBottom: "24px" }}>
              &ldquo;Ce produit a complètement transformé notre façon de travailler. L’équipe est incroyablement réactive et les fonctionnalités ne cessent de s’améliorer.&rdquo;
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div 
                style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700
                }}
              >
                JD
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Tim Cook</div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>PDG, Apple</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer 
          style={{ 
            marginTop: "120px",
            paddingTop: "60px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            paddingBottom: "60px"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
                UpFlow Démo
              </span>
            </div>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              © 2026 UpFlow Démo. Tous droits réservés.
            </p>
          </div>

          <div style={{ display: "flex", gap: "60px" }}>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>Produit</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <a href="#" style={{ fontSize: "14px", color: "#6b7280", textDecoration: "none" }}>Fonctionnalités</a>
                <a href="#" style={{ fontSize: "14px", color: "#6b7280", textDecoration: "none" }}>Tarifs</a>
                <a href="#" style={{ fontSize: "14px", color: "#6b7280", textDecoration: "none" }}>Journal des modifications</a>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>Entreprise</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <a href="#" style={{ fontSize: "14px", color: "#6b7280", textDecoration: "none" }}>À propos</a>
                <a href="#" style={{ fontSize: "14px", color: "#6b7280", textDecoration: "none" }}>Blog</a>
                <a href="#" style={{ fontSize: "14px", color: "#6b7280", textDecoration: "none" }}>Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Action Buttons - Bottom Right */}
      {!isWidgetOpen && (
        <div 
          style={{ 
            position: "fixed",
            bottom: "24px",
            right: "100px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            zIndex: 999
          }}
          className="animate-fade-in"
        >
          

          <button
            onClick={() => setIsWidgetOpen(true)}
            style={{
              background: "white",
              color: "#111827",
              border: "1px solid #e5e7eb",
              padding: "12px 20px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
            }}
          >
            <span style={{ fontSize: "16px" }}>💡</span>
            Proposer une fonctionnalité
          </button>
        </div>
      )}

      {/* UpFlow Widget */}
      <VoteWidget
        isOpen={isWidgetOpen}
        onToggle={() => setIsWidgetOpen(!isWidgetOpen)}
        projectId={projectId}
        projectKey={projectKey}
        siteOrigin={typeof window !== "undefined" ? window.location.origin : ""}
        enablePing
      />
    </div>
  );
}

export default function WidgetDemoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
          <div style={{ color: "#6b7280" }}>Chargement...</div>
        </div>
      }
    >
      <WidgetDemoContent />
    </Suspense>
  );
}
