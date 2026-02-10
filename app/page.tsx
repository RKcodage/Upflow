/**
 * UpFlow - Feature Request Management Demo
 * Theme: Dark charcoal with electric cyan and coral accents
 *
 * This is a demo mockup. Features are simulated for presentation purposes.
 * Shows a developer tool for collecting and managing feature requests with community voting.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import FeatureList from "./components/FeatureList";
import CreateFeatureModal from "./components/CreateFeatureModal";
import ProjectSettingsModal from "./components/ProjectSettingsModal";
import DeleteFeatureModal from "./components/DeleteFeatureModal";

export interface Feature {
  id: string;
  title: string;
  description: string;
  status: "planned" | "in-progress" | "completed" | "under-review";
  category: string;
  votes: number;
  comments: number;
  author: string;
  date: string;
  userVote: "up" | "down" | null;
}

type ApiFeature = {
  id: string;
  title: string;
  description: string;
  status: "live" | "planned" | "in-progress" | "under-review";
  category: string;
  votes: number;
  createdAt?: string | null;
  userVoted?: boolean;
};

const VISITOR_KEY = "upflow-admin-id";
type ApiNotification = {
  id: string;
  title: string;
  createdAt?: string | null;
};
type AuthUser = {
  id: string;
  email: string;
};
type WidgetOriginStatus = {
  siteOrigin: string;
  lastSeenAt: string | null;
  connected: boolean;
  lastSeenLabel: string;
};
type WidgetOriginPayload = {
  siteOrigin?: unknown;
  lastSeenAt?: unknown;
  connected?: unknown;
};

const isWidgetOriginPayload = (
  origin: WidgetOriginPayload
): origin is WidgetOriginPayload & { siteOrigin: string } =>
  Boolean(origin && typeof origin.siteOrigin === "string");

const generateVisitorId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const mapStatus = (status: ApiFeature["status"]): Feature["status"] => {
  if (status === "live") return "completed";
  if (status === "under-review") return "under-review";
  if (status === "planned" || status === "in-progress") return status;
  return "under-review";
};

const mapApiFeature = (feature: ApiFeature): Feature => {
  const createdAt = feature.createdAt ?? new Date().toISOString();
  return {
    id: feature.id,
    title: feature.title,
    description: feature.description,
    status: mapStatus(feature.status),
    category: feature.category,
    votes: feature.votes,
    comments: 0,
    author: "Utilisateur",
    date: createdAt,
    userVote: feature.userVoted ? "up" : null,
  };
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 1) return "à l'instant";
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} j`;
  return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
};

const mapToApiStatus = (status: Feature["status"]): ApiFeature["status"] => {
  if (status === "completed") return "live";
  return status;
};

export default function Home() {
  const router = useRouter();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [siteOrigin, setSiteOrigin] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationItems, setNotificationItems] = useState<ApiNotification[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [autoSelectAttempted, setAutoSelectAttempted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Feature | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [widgetConnected, setWidgetConnected] = useState(false);
  const [widgetOrigins, setWidgetOrigins] = useState<WidgetOriginStatus[]>([]);

  const isAuthed = Boolean(authUser);

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

  useEffect(() => {
    if (!isAuthed) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("projectId");
    const storedProjectId = window.localStorage.getItem("upflow-admin-project-id");
    const resolved = (fromQuery ?? storedProjectId ?? "").trim();
    setProjectId(resolved || "");

    const keyFromQuery = params.get("projectKey");
    const storedProjectKey = window.localStorage.getItem("upflow-admin-project-key");
    setProjectKey((keyFromQuery ?? storedProjectKey ?? "").trim());

    setSiteOrigin(window.location.origin);
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    if (autoSelectAttempted) return;
    if (projectId) return;
    if (typeof window === "undefined") return;

    const autoSelect = async () => {
      try {
        const response = await fetch("/api/projects", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || "Impossible de charger les projets");
        }
        const items = Array.isArray(data.projects) ? data.projects : [];
        if (!items.length) {
          setAutoSelectAttempted(true);
          return;
        }
        const first = items[0];
        if (first?.projectId) {
          window.localStorage.setItem("upflow-admin-project-id", first.projectId);
          if (first.publicKey) {
            window.localStorage.setItem("upflow-admin-project-key", first.publicKey);
          } else {
            window.localStorage.removeItem("upflow-admin-project-key");
          }
          setProjectId(first.projectId);
          setProjectKey((first.publicKey ?? "").trim());
          window.dispatchEvent(new Event("upflow:project-change"));
        }
        setAutoSelectAttempted(true);
      } catch (error) {
        setAutoSelectAttempted(true);
      }
    };

    void autoSelect();
  }, [isAuthed, autoSelectAttempted, projectId]);

  useEffect(() => {
    if (!isAuthed) return;
    if (typeof window === "undefined") return;
    const handler = () => {
      const storedProjectId = window.localStorage.getItem("upflow-admin-project-id");
      const storedProjectKey = window.localStorage.getItem("upflow-admin-project-key");
      setProjectId((storedProjectId ?? "").trim());
      setProjectKey((storedProjectKey ?? "").trim());
    };
    window.addEventListener("upflow:project-change", handler);
    return () => window.removeEventListener("upflow:project-change", handler);
  }, [isAuthed]);

  const loadFeatures = async (
    activeProjectId: string,
    activeProjectKey: string,
    activeSiteOrigin: string,
    voterId: string
  ) => {
    try {
      if (!activeProjectKey && !activeSiteOrigin) {
        setFeatures([]);
        return;
      }
      const params = new URLSearchParams({
        projectId: activeProjectId,
        voterId,
      });
      if (activeProjectKey) params.set("projectKey", activeProjectKey);
      if (activeSiteOrigin) params.set("siteOrigin", activeSiteOrigin);

      const response = await fetch(`/api/features?${params.toString()}`, {
        cache: "no-store",
        headers: { "x-upflow-admin": "1" },
      });

      if (!response.ok) {
        throw new Error("Failed to load features");
      }

      const data = await response.json();
      const nextFeatures = Array.isArray(data.features) ? data.features.map(mapApiFeature) : [];
      setFeatures(nextFeatures);
    } catch (error) {
      setFeatures([]);
    }
  };

  const loadNotifications = async (
    activeProjectId: string,
    activeProjectKey: string,
    activeSiteOrigin: string
  ) => {
    try {
      if (!activeProjectId) {
        setNotificationItems([]);
        setNotificationCount(0);
        return;
      }

      const params = new URLSearchParams({ projectId: activeProjectId });
      if (activeProjectKey) params.set("projectKey", activeProjectKey);
      if (activeSiteOrigin) params.set("siteOrigin", activeSiteOrigin);

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        cache: "no-store",
        headers: { "x-upflow-admin": "1" },
      });

      if (!response.ok) {
        throw new Error("Failed to load notifications");
      }

      const data = await response.json();
      const nextNotifications = Array.isArray(data.notifications) ? data.notifications : [];
      const nextCount =
        typeof data.unreadCount === "number" ? data.unreadCount : nextNotifications.length;

      setNotificationItems(nextNotifications);
      setNotificationCount(nextCount);
    } catch (error) {
      setNotificationItems([]);
      setNotificationCount(0);
    }
  };

  const loadWidgetStatus = async (
    activeProjectId: string,
    activeProjectKey: string,
    activeSiteOrigin: string
  ) => {
    try {
      if (!activeProjectId) {
        setWidgetConnected(false);
        return;
      }

      const params = new URLSearchParams({ projectId: activeProjectId });
      if (activeProjectKey) params.set("projectKey", activeProjectKey);
      if (activeSiteOrigin) params.set("siteOrigin", activeSiteOrigin);
      const response = await fetch(`/api/widget/ping?${params.toString()}`, {
        cache: "no-store",
        headers: { "x-upflow-admin": "1" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load widget status");
      }
      const origins = Array.isArray(data?.origins) ? (data.origins as WidgetOriginPayload[]) : [];
      const nextOrigins = origins.filter(isWidgetOriginPayload).map((origin) => {
          const lastSeenAt =
            typeof origin.lastSeenAt === "string" && origin.lastSeenAt.trim()
              ? origin.lastSeenAt
              : null;
          return {
            siteOrigin: origin.siteOrigin,
            lastSeenAt,
            connected: Boolean(origin.connected),
            lastSeenLabel: lastSeenAt ? formatRelativeTime(lastSeenAt) : "Jamais",
          };
        });
      setWidgetOrigins(nextOrigins);
      setWidgetConnected(nextOrigins.some((origin) => origin.connected));
    } catch (error) {
      setWidgetConnected(false);
      setWidgetOrigins([]);
    }
  };

  useEffect(() => {
    if (!isAuthed || !visitorId || !projectId) return;
    void loadFeatures(projectId, projectKey, siteOrigin, visitorId);
  }, [isAuthed, visitorId, projectId, projectKey, siteOrigin]);

  useEffect(() => {
    if (!isAuthed || !visitorId || !projectId) return;
    const interval = window.setInterval(() => {
      void loadFeatures(projectId, projectKey, siteOrigin, visitorId);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [isAuthed, visitorId, projectId, projectKey, siteOrigin]);

  useEffect(() => {
    if (!isAuthed || !projectId) return;
    void loadNotifications(projectId, projectKey, siteOrigin);
  }, [isAuthed, projectId, projectKey, siteOrigin]);

  useEffect(() => {
    if (!isAuthed || !projectId) return;
    const interval = window.setInterval(() => {
      void loadNotifications(projectId, projectKey, siteOrigin);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [isAuthed, projectId, projectKey, siteOrigin]);

  useEffect(() => {
    if (!isAuthed) return;
    if (typeof window === "undefined") return;
    const handler = () => {
      if (!projectId) return;
      void loadWidgetStatus(projectId, projectKey, siteOrigin);
    };
    window.addEventListener("upflow:widget-check", handler);
    return () => window.removeEventListener("upflow:widget-check", handler);
  }, [isAuthed, projectId, projectKey, siteOrigin]);

  useEffect(() => {
    if (!isAuthed || !projectId) {
      setWidgetConnected(false);
      return;
    }
    void loadWidgetStatus(projectId, projectKey, siteOrigin);
  }, [isAuthed, projectId, projectKey, siteOrigin]);

  useEffect(() => {
    if (!isAuthed || !projectId) return;
    const interval = window.setInterval(() => {
      void loadWidgetStatus(projectId, projectKey, siteOrigin);
    }, 20000);
    return () => window.clearInterval(interval);
  }, [isAuthed, projectId, projectKey, siteOrigin]);

  const handleVote = async (featureId: string, voteType: "up" | "down") => {
    if (!visitorId) return;
    if (!projectKey && !siteOrigin) return;

    const current = features.find((feature) => feature.id === featureId);
    if (voteType === "down" && current?.userVote !== "up") return;

    try {
      const response = await fetch(`/api/features/${featureId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-upflow-admin": "1" },
        body: JSON.stringify({
          voterId: visitorId,
          projectKey,
          siteOrigin,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();
      setFeatures((prev) =>
        prev.map((feature) =>
          feature.id === featureId
            ? {
                ...feature,
                votes: data.votes,
                userVote: data.userVoted ? "up" : null,
              }
            : feature
        )
      );
    } catch (error) {
      // keep UI as-is on failure
    }
  };

  const handleStatusChange = async (featureId: string, nextStatus: Feature["status"]) => {
    if (!visitorId) return;
    if (!projectKey && !siteOrigin) return;

    try {
      const response = await fetch(`/api/features/${featureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-upflow-admin": "1" },
        body: JSON.stringify({
          status: mapToApiStatus(nextStatus),
          projectKey,
          siteOrigin,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const data = await response.json();
      setFeatures((prev) =>
        prev.map((feature) =>
          feature.id === featureId
            ? {
                ...feature,
                status: mapStatus(data.status as ApiFeature["status"]),
              }
            : feature
        )
      );
    } catch (error) {
      // ignore for now
    }
  };

  const handleCreateFeature = async (
    newFeature: Omit<Feature, "id" | "votes" | "comments" | "date" | "userVote">
  ) => {
    if (!visitorId) return;
    if (!projectKey && !siteOrigin) return;

    try {
      const response = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-upflow-admin": "1" },
        body: JSON.stringify({
          title: newFeature.title,
          description: newFeature.description,
          category: newFeature.category,
          projectId,
          projectKey,
          siteOrigin,
          voterId: visitorId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create feature");
      }

      const data = await response.json();
      if (data?.feature) {
        setFeatures((prev) => [mapApiFeature(data.feature), ...prev]);
      }
    } catch (error) {
      // ignore for now
    } finally {
      setIsCreateModalOpen(false);
    }
  };

  const handleNotificationsOpen = () => {
    if (!projectId) return;
    void loadNotifications(projectId, projectKey, siteOrigin);
  };

  const handleNotificationsClear = async () => {
    if (!projectId) return;

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-upflow-admin": "1" },
        body: JSON.stringify({
          projectId,
          projectKey,
          siteOrigin,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to clear notifications");
      }

      setNotificationItems([]);
      setNotificationCount(0);
    } catch (error) {
      // keep existing notifications on failure
    }
  };

  const handleDeleteRequest = (feature: Feature) => {
    setDeleteTarget(feature);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/features/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-upflow-admin": "1" },
        body: JSON.stringify({
          projectKey,
          siteOrigin,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete feature");
      }

      setFeatures((prev) => prev.filter((feature) => feature.id !== deleteTarget.id));
      if (projectId) {
        void loadNotifications(projectId, projectKey, siteOrigin);
      }
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      // ignore for now
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClose = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const notificationSummaries = useMemo(
    () =>
      notificationItems
        .slice(0, 3)
        .map((notification) => ({
          id: notification.id,
          title: notification.title,
          time: formatRelativeTime(notification.createdAt ?? new Date().toISOString()),
        })),
    [notificationItems]
  );

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("upflow-admin-project-id");
        window.localStorage.removeItem("upflow-admin-project-key");
      }
      setAuthUser(null);
      router.push("/login");
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
    <div className="flex flex-col" style={{ height: "100vh" }}>
      <Navbar
        onCreateClick={() => setIsCreateModalOpen(true)}
        onProjectsClick={() => setIsProjectsModalOpen(true)}
        notificationCount={notificationCount}
        notifications={notificationSummaries}
        onNotificationsOpen={handleNotificationsOpen}
        onNotificationsClear={handleNotificationsClear}
        widgetConnected={widgetConnected}
        widgetOrigins={widgetOrigins}
        user={authUser}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          features={features}
        />

        <FeatureList
          features={features}
          selectedFilter={selectedFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onVote={handleVote}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteRequest}
        />
      </div>

      {isCreateModalOpen && (
        <CreateFeatureModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateFeature}
        />
      )}

      {isProjectsModalOpen && (
        <ProjectSettingsModal onClose={() => setIsProjectsModalOpen(false)} />
      )}

      {isDeleteModalOpen && deleteTarget && (
        <DeleteFeatureModal
          featureTitle={deleteTarget.title}
          isDeleting={isDeleting}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
