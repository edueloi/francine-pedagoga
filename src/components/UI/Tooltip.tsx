import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface TooltipProps {
  text: string;
  className?: string;
}

// Simple hover/focus tooltip anchored to a "?" icon — no external positioning library,
// just a CSS-only bubble that appears above the trigger on hover/focus.
export const Tooltip: React.FC<TooltipProps> = ({ text, className }) => {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        tabIndex={0}
        aria-label={text}
        className="text-slate-300 hover:text-slate-500 transition-colors cursor-help"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-medium leading-relaxed text-white shadow-lg z-50 pointer-events-none"
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 h-2 w-2 rotate-45 bg-slate-900" />
        </span>
      )}
    </span>
  );
};

export default Tooltip;
