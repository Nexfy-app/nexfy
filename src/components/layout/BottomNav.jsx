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
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pt-1" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <div className="glass-strong rounded-2xl max-w-lg mx-auto">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.map((item) => {
            const { path, icon: Icon, label } = item;
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={(e) => handleNavClick(e, item)}
                className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 min-w-[52px]"
              >
                <div className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-foreground shadow-md"
                    : "hover:bg-muted"
                )}>
                  <Icon
                    className={cn("w-4.5 h-4.5 transition-all", isActive ? "text-white" : "text-muted-foreground")}
                    style={{ width: '18px', height: '18px' }}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all",
                  isActive ? "text-foreground font-semibold" : "text-muted-foreground"
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