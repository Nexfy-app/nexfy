import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, Search, MessageSquare, User, Briefcase } from 'lucide-react';
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}