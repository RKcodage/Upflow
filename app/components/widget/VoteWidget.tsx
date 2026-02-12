"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare, X, Plus, Search, TrendingUp, Clock } from "lucide-react";
import WidgetFeatureCard from "./WidgetFeatureCard";
import SubmitFeatureForm from "./SubmitFeatureForm";

interface VoteWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  projectId?: string;
  projectKey?: string;
  siteOrigin?: string;
  enablePing?: boolean;
}

interface Feature {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: "live" | "planned" | "in-progress" | "under-review";
  category: string;
  userVoted: boolean;
  createdAt?: string | null;
}

const DEFAULT_PROJECT_ID = "default";
const VISITOR_KEY = "upflow-visitor-id";

const generateVisitorId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function VoteWidget({
  isOpen,
  onToggle,
  projectId = DEFAULT_PROJECT_ID,
  projectKey = "",
  siteOrigin = "",
  enablePing = false,
}: VoteWidgetProps) {
  const resolvedProjectId = projectId.trim() ? projectId.trim() : DEFAULT_PROJECT_ID;
  const resolvedProjectKey = projectKey.trim();
  const resolvedSiteOrigin = siteOrigin.trim();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "live" | "planned" | "in-progress">("all");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(VISITOR_KEY);
    if (stored) {
      setVisitorId(stored);
      return;
    }
    const nextId = generateVisitorId();
    window.localStorage.setItem(VISITOR_KEY, nextId);
    setVisitorId(nextId);
  }, []);

  const loadFeatures = async () => {
    try {
      if (!resolvedProjectKey && !resolvedSiteOrigin) {
        setFeatures([]);
        setIsLoading(false);
        setToastMessage("Projet non configuré");
        setShowToast(true);
        return;
      }
      setIsLoading(true);
      const params = new URLSearchParams({
        projectId: resolvedProjectId,
        voterId: visitorId ?? "",
      });
      if (resolvedProjectKey) params.set("projectKey", resolvedProjectKey);
      if (resolvedSiteOrigin) params.set("siteOrigin", resolvedSiteOrigin);
      const response = await fetch(`/api/features?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load features");
      }

      const data = await response.json();
      setFeatures(Array.isArray(data.features) ? data.features : []);
    } catch (error) {
      setToastMessage("Impossible de charger les fonctionnalités");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!visitorId) return;
    void loadFeatures();
  }, [visitorId, resolvedProjectId, resolvedProjectKey, resolvedSiteOrigin]);

  useEffect(() => {
    if (!enablePing) return;
    if (!resolvedProjectId || (!resolvedProjectKey && !resolvedSiteOrigin)) return;
    let intervalId: number | null = null;

    const ping = async () => {
      try {
        await fetch("/api/widget/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: resolvedProjectId,
            projectKey: resolvedProjectKey,
            siteOrigin: resolvedSiteOrigin,
          }),
        });
      } catch (error) {
        // ignore ping failures
      }
    };

    void ping();
    intervalId = window.setInterval(ping, 20000);
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [enablePing, resolvedProjectId, resolvedProjectKey, resolvedSiteOrigin]);

  const handleVote = async (featureId: string) => {
    if (!visitorId) return;
    if (!resolvedProjectKey && !resolvedSiteOrigin) return;
    try {
      const response = await fetch(`/api/features/${featureId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterId: visitorId,
          projectKey: resolvedProjectKey,
          siteOrigin: resolvedSiteOrigin,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();
      setFeatures((prev) =>
        prev.map((feature) =>
          feature.id === featureId
            ? { ...feature, votes: data.votes, userVoted: data.userVoted }
            : feature
        )
      );

      setToastMessage(data.userVoted ? "Merci pour votre vote ! 🎉" : "Vote retiré");
      setShowToast(true);
    } catch (error) {
      setToastMessage("Impossible de voter pour le moment");
      setShowToast(true);
    }
  };

  const handleSubmitFeature = async (title: string, description: string, category: string) => {
    if (!visitorId) return;
    if (!resolvedProjectKey && !resolvedSiteOrigin) return;
    try {
      const response = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          projectId: resolvedProjectId,
          projectKey: resolvedProjectKey,
          siteOrigin: resolvedSiteOrigin,
          voterId: visitorId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create feature");
      }

      const data = await response.json();
      if (data?.feature) {
        setFeatures((prev) => [data.feature, ...prev]);
      }
      setShowSubmitForm(false);
      setToastMessage("Demande de fonctionnalité envoyée ! 🚀");
      setShowToast(true);
    } catch (error) {
      setToastMessage("Impossible d'envoyer la demande");
      setShowToast(true);
    }
  };

  const filteredAndSortedFeatures = useMemo(() => {
    const filtered = features.filter((feature) => {
      if (filterStatus !== "all" && feature.status !== filterStatus) return false;
      if (searchQuery && !feature.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "votes") return b.votes - a.votes;
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [features, filterStatus, searchQuery, sortBy]);

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="animate-scale-in"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 30px rgba(107, 89, 215, 0.4)",
            zIndex: 1000,
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <MessageSquare size={28} color="white" strokeWidth={2} />
        </button>
      )}

      {/* Slide-in Panel */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 999,
              opacity: isOpen ? 1 : 0,
              transition: "opacity 0.3s",
            }}
            onClick={onToggle}
          />

          {/* Panel */}
          <div
            className="animate-slide-up"
            style={{
              position: "fixed",
              right: "0",
              top: "0",
              bottom: "0",
              width: "440px",
              maxWidth: "100vw",
              background: "var(--color-card)",
              boxShadow: "-10px 0 50px rgba(0, 0, 0, 0.3)",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              animation: "slideInRight 0.3s ease-out",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-background-secondary)",
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: "8px" }}>
                <div className="flex items-center" style={{ gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MessageSquare size={18} color="white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-foreground)" }}>
                      Demandes de fonctionnalités
                    </h2>
                    <p style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "2px" }}>
                      Votez pour ce que nous construisons ensuite
                    </p>
                  </div>
                </div>

                <button
                  onClick={onToggle}
                  className="btn-icon"
                  style={{
                    color: "var(--color-muted)",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Controls */}
            {!showSubmitForm && (
              <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
                {/* Search */}
                <div className="relative flex items-center" style={{ marginBottom: "12px" }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      color: "var(--color-muted)",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Rechercher des fonctionnalités..."
                    className="input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      paddingLeft: "38px",
                      paddingRight: "12px",
                      paddingTop: "8px",
                      paddingBottom: "8px",
                      fontSize: "13px",
                    }}
                  />
                </div>

                {/* Filters and Sort */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center" style={{ gap: "6px" }}>
                    <button
                      className={`badge ${filterStatus === "all" ? "badge-in-progress" : "category-tag"}`}
                      style={{ padding: "6px 12px", border: "1px solid var(--color-border)", cursor: "pointer" }}
                      onClick={() => setFilterStatus("all")}
                    >
                      Tous
                    </button>
                    <button
                      className={`badge ${filterStatus === "live" ? "badge-completed" : "category-tag"}`}
                      style={{ padding: "6px 12px", border: "1px solid var(--color-border)", cursor: "pointer" }}
                      onClick={() => setFilterStatus("live")}
                    >
                      En ligne
                    </button>
                    <button
                      className={`badge ${filterStatus === "in-progress" ? "badge-in-progress" : "category-tag"}`}
                      style={{ padding: "6px 12px", border: "1px solid var(--color-border)", cursor: "pointer" }}
                      onClick={() => setFilterStatus("in-progress")}
                    >
                      En cours
                    </button>
                  </div>

                  <button
                    className="btn-ghost flex items-center"
                    style={{ padding: "6px 10px", gap: "4px", fontSize: "12px" }}
                    onClick={() => setSortBy(sortBy === "votes" ? "recent" : "votes")}
                  >
                    {sortBy === "votes" ? <TrendingUp size={14} /> : <Clock size={14} />}
                    {sortBy === "votes" ? "Populaire" : "Nouveau"}
                  </button>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto" style={{ background: "var(--color-background)" }}>
              {showSubmitForm ? (
                <SubmitFeatureForm onSubmit={handleSubmitFeature} onCancel={() => setShowSubmitForm(false)} />
              ) : isLoading ? (
                <div
                  className="flex flex-col items-center justify-center"
                  style={{ padding: "60px 20px" }}
                >
                  <p style={{ fontSize: "14px", color: "var(--color-muted)" }}>Chargement...</p>
                </div>
              ) : (
                <div style={{ padding: "16px" }}>
                  <div className="flex flex-col" style={{ gap: "12px" }}>
                    {filteredAndSortedFeatures.map((feature) => (
                      <WidgetFeatureCard key={feature.id} feature={feature} onVote={handleVote} />
                    ))}
                  </div>

                  {filteredAndSortedFeatures.length === 0 && (
                    <div
                      className="flex flex-col items-center justify-center"
                      style={{ padding: "60px 20px" }}
                    >
                      <Search size={40} color="var(--color-muted)" />
                      <p style={{ fontSize: "14px", color: "var(--color-muted)", marginTop: "12px" }}>
                        Aucune fonctionnalité trouvée
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {!showSubmitForm && (
              <div
                style={{
                  padding: "16px",
                  borderTop: "1px solid var(--color-border)",
                  background: "var(--color-background-secondary)",
                }}
              >
                <button
                  className="btn-primary flex items-center cursor-pointer"
                  style={{ width: "100%", padding: "12px", gap: "8px", justifyContent: "center" }}
                  onClick={() => setShowSubmitForm(true)}
                >
                  <Plus size={18} />
                  Proposer une fonctionnalité
                </button>

                <div
                  style={{
                    marginTop: "12px",
                    textAlign: "center",
                    fontSize: "11px",
                    color: "var(--color-muted)",
                  }}
                >
                  Propulsé par <strong style={{ color: "var(--color-accent)" }}>UpFlow</strong>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div
          className="toast toast-success toast-widget-success animate-slide-up"
          style={{
            padding: "14px 20px",
            gap: "10px",
            bottom: isOpen ? "auto" : "100px",
            top: isOpen ? "24px" : "auto",
            right: isOpen ? "460px" : "24px",
            zIndex: 1001,
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 700 }}>{toastMessage}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
