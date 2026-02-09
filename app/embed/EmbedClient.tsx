"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import VoteWidget from "../components/widget/VoteWidget";

type Theme = "dark" | "light";

function hexToRgba(hex: string, alpha: number) {
  const match = hex.trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function EmbedClient() {
  const searchParams = useSearchParams();
  const theme = (searchParams.get("theme") as Theme) ?? "dark";
  const accent = searchParams.get("accent") ?? "";
  const projectId = searchParams.get("projectId") ?? "default";
  const projectKey = searchParams.get("projectKey") ?? "";
  const siteOrigin = searchParams.get("siteOrigin") ?? "";

  const cssVarOverrides = useMemo(() => {
    const overrides: Record<string, string> = {};

    if (theme === "light") {
      overrides["--color-background"] = "#ffffff";
      overrides["--color-background-secondary"] = "#f6f7fb";
      overrides["--color-foreground"] = "#0b1220";
      overrides["--color-card"] = "#ffffff";
      overrides["--color-card-hover"] = "#f3f4f6";
      overrides["--color-border"] = "#e5e7eb";
      overrides["--color-border-light"] = "#d1d5db";
      overrides["--color-muted"] = "#6b7280";
      overrides["--color-accent-foreground"] = "#ffffff";
    }

    if (accent) {
      overrides["--color-accent"] = accent;
      const accentLight = hexToRgba(accent, 0.12);
      if (accentLight) overrides["--color-accent-light"] = accentLight;
    }

    return overrides as React.CSSProperties;
  }, [theme, accent]);

  const requestClose = () => {
    window.parent?.postMessage({ type: "UPFLOW_CLOSE" }, "*");
  };

  useEffect(() => {
    window.parent?.postMessage({ type: "UPFLOW_READY" }, "*");
  }, []);

  useEffect(() => {
    if (!projectId || !siteOrigin) return;
    let intervalId: number | null = null;

    const ping = async () => {
      try {
        await fetch("/api/widget/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            projectKey,
            siteOrigin,
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
  }, [projectId, projectKey, siteOrigin]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <div style={cssVarOverrides}>
        <VoteWidget
          isOpen
          onToggle={requestClose}
          projectId={projectId}
          projectKey={projectKey}
          siteOrigin={siteOrigin}
        />
      </div>

      <style jsx global>{`
        html,
        body {
          background: transparent !important;
        }
      `}</style>
    </>
  );
}
