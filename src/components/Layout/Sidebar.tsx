import React, { useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, ChevronDown, X } from "lucide-react";
import { NAV_SECTIONS } from "../../constants";
import { LogoSVG } from "../LandingPage";
import { UserRole, UserPermissions } from "../../types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  userName: string;
  userRole: UserRole;
  activePermissions: UserPermissions;
}

const STORAGE_KEY = "sidebar_collapsed_sections";

function loadCollapsed(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCollapsed(state: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onLogout,
  userName,
  userRole,
  activePermissions,
}) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsed);

  const toggleSection = useCallback((title: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      saveCollapsed(next);
      return next;
    });
  }, []);

  const visibleSections = React.useMemo(() => {
    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.permissionKey) return true;
        return activePermissions[item.permissionKey]?.ler;
      }),
    })).filter((section) => section.items.length > 0);
  }, [activePermissions]);

  return (
    <>
      {/* Mobile/tablet overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/60 z-[105] lg:hidden backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 left-0 z-[110] h-full w-72 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 shadow-2xl lg:translate-x-0 lg:static lg:z-auto lg:shadow-sm select-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / branding */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 shrink-0">
          <div className="h-14 w-16 flex items-center justify-center shrink-0">
            <LogoSVG className="h-full w-full" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight leading-tight">
              Espaço <span className="text-[#1070ca]">Aprender a Ser</span>
            </h1>
            <p className="text-[9px] text-[#ebb448] mt-0.5 uppercase tracking-wider font-mono font-black">
              CLÍNICA MULTI
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-0.5">
            {visibleSections.map((section) => {
              const isCollapsed = collapsed[section.title];
              const hasActiveItem = section.items.some((item) =>
                item.path === "/dashboard"
                  ? location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.path)
              );

              return (
                <div key={section.title} className="mb-1">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all duration-150 group text-slate-400 hover:text-[#1070ca] hover:bg-blue-50/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.12em]">
                        {section.title}
                      </span>
                      {hasActiveItem && isCollapsed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1070ca]" />
                      )}
                    </div>
                    <ChevronDown
                      size={12}
                      className={`opacity-50 group-hover:opacity-100 transition-all duration-200 ${
                        isCollapsed ? "-rotate-90" : "rotate-0"
                      }`}
                    />
                  </button>

                  {!isCollapsed && (
                    <div className="mt-0.5 space-y-0.5">
                      {section.items.map((item) => {
                        const IconComponent = item.icon;
                        const isActive =
                          item.path === "/dashboard"
                            ? location.pathname === "/dashboard"
                            : location.pathname.startsWith(item.path);

                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                              isActive
                                ? "bg-[#1070ca] text-white shadow-sm shadow-blue-500/10"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                            }`}
                          >
                            <IconComponent
                              className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-400"}`}
                            />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Desconectar / Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
