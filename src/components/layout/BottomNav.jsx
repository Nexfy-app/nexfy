import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Map, Search, Briefcase, MessageSquare, User } from 'lucide-react';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';

// Routes that require login
const PROTECTED = ['/requests', '/chat', '/profile'];

const navItems = [
  { path: "/", icon: Map, label: "Mapa", protected: false },
  { path: "/explore", icon: Search, label: "Explorar", protected: false },
  { path: "/requests", icon: Briefcase, label: "Pedidos", protected: true },
  { path: "/chat", icon: MessageSquare, label: "Chat", protected: true },
  { path: "/profile", icon: User, label: "Perfil", protected: true },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = async (e, item) => {
    if (!item.protected) return; // allow freely
    e.preventDefault();
    const authed = await base44.auth.isAuthenticated();
    if (authed) {
      navigate(item.path);
    } else {
      base44.auth.redirectToLogin(window.location.origin + item.path);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 px-4"
      style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))', userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div
        className="max-w-lg mx-auto"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderRadius: 28,
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.10)',
        }}
      >
        <div className="flex items-center justify-around px-1 py-2">
          {navItems.map((item) => {
            const { path, icon: Icon, label } = item;
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={(e) => handleNavClick(e, item)}
                className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[54px] relative"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center transition-all duration-200"
                  style={{
                    borderRadius: 16,
                    background: isActive ? 'hsl(224 32% 8%)' : 'transparent',
                    boxShadow: isActive ? '0 2px 10px rgba(15,20,40,0.18)' : 'none',
                    transform: isActive ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  <Icon
                    style={{ width: 18, height: 18 }}
                    className={cn("transition-all", isActive ? "text-white" : "text-slate-400")}
                    strokeWidth={isActive ? 2.5 : 1.9}
                  />
                </div>
                <span
                  className={cn("text-[10px] tracking-tight transition-all leading-none mt-0.5", isActive ? "text-foreground font-semibold" : "text-slate-400 font-medium")}
                >
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