"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, SquareCheckBig, Settings, Bell } from "lucide-react";
import UserMenu from "./UserMenu";

interface NavbarProps {
  onCreateClick: () => void;
  onProjectsClick: () => void;
  notificationCount: number;
  notifications: { id: string; title: string; time: string }[];
  onNotificationsOpen: () => void;
  onNotificationsClear: () => void;
  widgetConnected: boolean;
  widgetOrigins: { siteOrigin: string; lastSeenLabel: string; connected: boolean }[];
  user: { id: string; email: string };
  onLogout: () => void;
}

export default function Navbar({
  onCreateClick,
  onProjectsClick,
  notificationCount,
  notifications,
  onNotificationsOpen,
  onNotificationsClear,
  widgetConnected,
  widgetOrigins,
  user,
  onLogout,
}: NavbarProps) {
  const widgetBadgeStyle = widgetConnected
    ? {
        background: "var(--color-success-bg)",
        border: "1px solid var(--color-success)",
        color: "var(--color-success)",
      }
    : {
        background: "var(--color-warning-bg)",
        border: "1px solid var(--color-warning)",
        color: "var(--color-warning)",
      };
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWidgetStatus, setShowWidgetStatus] = useState(false);
  const handleNotificationsClick = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) onNotificationsOpen();
  };
  const handleWidgetStatusClick = () => {
    setShowWidgetStatus((prev) => !prev);
  };

  return (
    <nav className="navbar">
      <div className="flex items-center" style={{ gap: "24px", paddingLeft: "24px" }}>
        <div className="flex items-center" style={{ gap: "12px" }}>
	          <div 
	            className="flex items-center justify-center" 
	            style={{ 
	              width: "36px", 
	              height: "36px", 
	              background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
	              borderRadius: "8px"
	            }}
	          >
            <SquareCheckBig size={20} color="#E4E7EB" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-foreground)" }}>
            UpFlow
          </span>
        </div>

        <div className="flex items-center" style={{ gap: "8px" }}>
          {/* <button className="btn-ghost" style={{ padding: "8px 12px" }}>
            Fonctionnalités
          </button>
          <button className="btn-ghost" style={{ padding: "8px 12px" }}>
            Feuille de route
          </button>
          <button className="btn-ghost" style={{ padding: "8px 12px" }}>
            Journal des modifications
          </button> */}
          <Link href="/demo" className="btn-ghost" style={{ padding: "8px 12px", textDecoration: "none" }}>
            Démo du widget
          </Link>
        </div>
      </div>

      <div className="flex items-center" style={{ gap: "12px", paddingRight: "24px" }}>
        <div className="relative">
          <button
            className="flex items-center cursor-pointer"
            onClick={handleWidgetStatusClick}
            style={{
              ...widgetBadgeStyle,
              borderRadius: "6px",
              padding: "4px 10px",
              gap: "6px",
            }}
          >
            <div 
              style={{ 
                width: "6px", 
                height: "6px", 
                borderRadius: "50%", 
                background: widgetConnected ? "var(--color-success)" : "var(--color-warning)",
              }} 
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: widgetConnected ? "var(--color-success)" : "var(--color-warning)",
              }}
            >
              {widgetConnected ? "Widget connecté" : "Widget non connecté"}
            </span>
          </button>
          {showWidgetStatus && (
            <div
              className="dropdown animate-slide-down"
              style={{
                top: "calc(100% + 8px)",
                right: "0",
                width: "320px",
                padding: "12px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                Statut par origine
              </div>
              {widgetOrigins.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                  Aucun ping reçu.
                </div>
              ) : (
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  {widgetOrigins.map((origin) => (
                    <div
                      key={origin.siteOrigin}
                      className="flex items-center justify-between"
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        background: "var(--color-card-hover)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600 }}>
                          {origin.siteOrigin}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>
                          Dernier ping: {origin.lastSeenLabel}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: origin.connected ? "var(--color-success)" : "var(--color-warning)",
                        }}
                      >
                        {origin.connected ? "Connecté" : "Inactif"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          className="btn-primary flex items-center cursor-pointer" 
          style={{ padding: "8px 16px", gap: "6px" }}
          onClick={onCreateClick}
        >
          <Plus size={18} />
          Nouvelle demande
        </button>

        <div className="relative">
          <button 
            className="btn-icon"
            onClick={handleNotificationsClick}
          >
            <Bell size={20} />
          </button>
          {notificationCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                borderRadius: "999px",
                background: "var(--color-danger)",
                color: "white",
                fontSize: "10px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 0 2px var(--color-card)",
              }}
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
          {showNotifications && (
            <div 
              className="dropdown animate-slide-down" 
              style={{ 
                top: "calc(100% + 8px)", 
                right: "0", 
                width: "320px",
                padding: "12px"
              }}
            >
              {notifications.length > 0 ? (
                <div className="flex flex-col" style={{ gap: "12px" }}>
                  <div className="flex items-center justify-between" style={{ gap: "12px" }}>
                    <div style={{ fontSize: "13px", color: "var(--color-foreground)" }}>
                      {notificationCount > 0
                        ? `Vous avez reçu ${notificationCount} nouvelle${notificationCount > 1 ? "s" : ""} demande${notificationCount > 1 ? "s" : ""}`
                        : "Dernières demandes reçues"}
                    </div>
                    <button
                      className="btn-ghost"
                      style={{ padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}
                      onClick={onNotificationsClear}
                    >
                      Tout effacer
                    </button>
                  </div>
                  <div className="divider-h" />
                  <div className="flex flex-col" style={{ gap: "10px" }}>
                    {notifications.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <span style={{ fontSize: "13px", color: "var(--color-foreground)" }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "13px", color: "var(--color-muted)", textAlign: "center" }}>
                  Aucune nouvelle notification
                </div>
              )}
            </div>
          )}
        </div>

        <button className="btn-icon" onClick={onProjectsClick}>
          <Settings size={20} />
        </button>

        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </nav>
  );
}
