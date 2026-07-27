import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface OptionsMenuOption {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Styles the option in red — use for destructive actions like Delete. */
  danger?: boolean;
}

interface OptionsMenuProps {
  options: OptionsMenuOption[];
  className?: string;
  buttonClassName?: string;
  align?: "left" | "right";
  ariaLabel?: string;
}

const MENU_WIDTH = 190;
const VIEWPORT_MARGIN = 8;

/**
 * A generic "..." button that opens a small dropdown of actions.
 * Used as the base for the playbar / album / track / playlist
 * options menus, each of which just supplies a different option list.
 *
 * The menu itself is rendered through a portal into document.body and
 * positioned with `position: fixed`, rather than being a normal child
 * of whatever scrollable/overflow-hidden container it's opened from.
 * Popups in this app clip their content with overflow-y-auto/hidden,
 * which would otherwise crop the dropdown for any row near the bottom
 * (or edge) of the popup.
 */
export function OptionsMenu({
  options,
  className = "",
  buttonClassName = "",
  align = "right",
  ariaLabel = "More options",
}: OptionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Compute where the portaled menu should sit, based on the button's
  // actual position in the viewport (not in document flow), and flip
  // above the button if there isn't room below.
  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const estimatedHeight = options.length * 36 + 8;

      let left = align === "right" ? rect.right - MENU_WIDTH : rect.left;
      left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN));

      let top = rect.bottom + 4;
      if (top + estimatedHeight > window.innerHeight - VIEWPORT_MARGIN) {
        top = rect.top - estimatedHeight - 4;
      }
      top = Math.max(VIEWPORT_MARGIN, top);

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, align, options.length]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors ${buttonClassName}`}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      {open && position && createPortal(
        <div
          ref={menuRef}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          className="fixed z-[100] rounded-lg border border-gray-700 bg-gray-900 shadow-2xl py-1"
        >
          {options.map((option) => (
            <button
              key={option.label}
              role="menuitem"
              disabled={option.disabled}
              onClick={() => {
                setOpen(false);
                option.onClick();
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                option.danger
                  ? "text-red-400 hover:bg-red-500/10 hover:text-red-300 border-t border-gray-800 mt-1 pt-2"
                  : "text-gray-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
