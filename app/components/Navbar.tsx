"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, SquareCheckBig, Settings, Bell } from "lucide-react";
import UserMenu from "./UserMenu";

interface NavbarProps {
  onCreateClick: () => void;
}

export default function Navbar({ onCreateClick }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

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
          <button className="btn-ghost" style={{ padding: "8px 12px" }}>
            Fonctionnalités
          </button>
          <button className="btn-ghost" style={{ padding: "8px 12px" }}>
            Feuille de route
          </button>
          <button className="btn-ghost" style={{ padding: "8px 12px" }}>
            Journal des modifications
          </button>
          <Link href="/demo" className="btn-ghost" style={{ padding: "8px 12px", textDecoration: "none" }}>
            Démo
          </Link>
        </div>
      </div>

      <div className="flex items-center" style={{ gap: "12px", paddingRight: "24px" }}>
        <div 
          className="flex items-center" 
          style={{ 
            background: "var(--color-success-bg)", 
            border: "1px solid var(--color-success)",
            borderRadius: "6px",
            padding: "4px 10px",
            gap: "6px"
          }}
        >
          <div 
            style={{ 
              width: "6px", 
              height: "6px", 
              borderRadius: "50%", 
              background: "var(--color-success)" 
            }} 
          />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-success)" }}>
            Offre Pro
          </span>
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
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
          </button>
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
              <div style={{ fontSize: "13px", color: "var(--color-muted)", textAlign: "center" }}>
                Aucune nouvelle notification
              </div>
            </div>
          )}
        </div>

        <button className="btn-icon">
          <Settings size={20} />
        </button>

        <UserMenu />
      </div>
    </nav>
  );
}
