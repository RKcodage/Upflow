"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Settings, LogOut } from "lucide-react";

type UserInfo = {
  id: string;
  email: string;
};

interface UserMenuProps {
  user: UserInfo;
  onLogout: () => void;
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "U";

  return (
    <div className="relative">
      <button
        className="avatar cursor-pointer"
        style={{ width: "36px", height: "36px" }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu utilisateur"
      >
        {initials}
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              inset: "0",
              zIndex: 40,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="dropdown animate-slide-down"
            style={{
              top: "calc(100% + 8px)",
              right: "0",
              width: "220px",
            }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-foreground)" }}>
                Compte admin
              </div>
              <div style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "2px" }}>
                {user.email}
              </div>
            </div>

            <div style={{ padding: "8px" }}>
              <Link
                href="/profile"
                className="flex items-center btn-ghost"
                style={{ 
                  width: "100%", 
                  padding: "10px 12px", 
                  gap: "12px",
                  justifyContent: "flex-start",
                  textDecoration: "none"
                }}
                onClick={() => setIsOpen(false)}
              >
                <User size={16} />
                <span style={{ fontSize: "14px" }}>Profil</span>
              </Link>

              <button
                className="flex items-center btn-ghost"
                style={{ 
                  width: "100%", 
                  padding: "10px 12px", 
                  gap: "12px",
                  justifyContent: "flex-start"
                }}
              >
                <Settings size={16} />
                <span style={{ fontSize: "14px" }}>Paramètres</span>
              </button>
            </div>

            <div className="divider-h" />

            <div style={{ padding: "8px" }}>
              <button
                className="flex items-center btn-ghost"
                style={{ 
                  width: "100%", 
                  padding: "10px 12px", 
                  gap: "12px",
                  justifyContent: "flex-start",
                  color: "var(--color-danger)",
                  cursor: "pointer"
                }}
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={16} />
                <span style={{ fontSize: "14px" }}>Déconnexion</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
