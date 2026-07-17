import React, { useState, useRef, useEffect } from "react";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { AuthUser } from "../../contexts/AuthContext";

interface TopbarProps {
  onMenuClick: () => void;
  onLogout: () => void;
  user: AuthUser | null;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, onLogout, user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <header className="sticky top-0 z-[100] h-14 sm:h-16 md:h-[72px] px-3 md:px-8 flex items-center justify-between transition-all duration-300 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.04)]">
      {/* Left: mobile menu toggle */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-500 transition-all duration-200 active:scale-95 hover:bg-blue-50 hover:text-[#1070ca] lg:hidden cursor-pointer"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Right: profile dropdown */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-all duration-200 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1070ca] to-[#d43f72] p-0.5 shadow-md shadow-blue-200 group-hover:shadow-blue-300 transition-shadow">
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <span className="font-bold text-[#1070ca] text-sm">{initials}</span>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-700 leading-none group-hover:text-[#1070ca] transition-colors">
                {user?.name || "Usuário"}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                {user?.role || ""}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 z-[200] bg-white rounded-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden origin-top-right">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conectado</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1070ca] font-bold overflow-hidden border border-slate-200">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                      {user?.role || ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2 border-t border-slate-50">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <LogOut size={16} /> Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
