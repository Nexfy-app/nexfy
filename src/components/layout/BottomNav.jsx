import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, Search, Briefcase, MessageSquare, User } from 'lucide-react';
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Map, label: "Mapa" },
  { path: "/explore", icon: Search, label: "Explorar" },
  { path: "/requests", icon: Briefcase, label: "Pedidos" },
  { path: "/chat", icon: MessageSquare, label: "Chat" },
  { path: "/profile", icon: User, label: "Perfil" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
      <div
        className="max-w-lg mx-auto rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(18, 20, 28, 0.85)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 min-w-[52px] relative"
              >
                <div className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 relative",
                  isActive ? "bg-primary/15" : ""
                )}>
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'rgba(59,130,246,0.15)', boxShadow: '0 0 16px rgba(59,130,246,0.2)' }}
                    />
                  )}
                  <Icon
                    className={cn("w-5 h-5 transition-all relative z-10", isActive ? "text-primary" : "text-muted-foreground")}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}