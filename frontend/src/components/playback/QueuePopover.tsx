import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { QueueList } from "./QueueList";

interface QueuePopoverProps {
  buttonClassName?: string;
}

const PANEL_WIDTH = 340;
const VIEWPORT_MARGIN = 12;
const MIN_PANEL_HEIGHT = 160;
const MAX_PANEL_HEIGHT = 480;

/**
 * The queue icon button shown in the mini (collapsed) player. Clicking it
 * opens a tooltip-style popover — anchored above the button since the
 * playback bar is pinned to the bottom of the screen — showing the
 * current track at the top followed by the upcoming queue.
 */
export function QueuePopover({ buttonClassName = "" }: QueuePopoverProps) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<{ left: number; bottom: number; maxHeight: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      let left = rect.right - PANEL_WIDTH;
      left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN));

      const bottom = window.innerHeight - rect.top + 8;
      const available = rect.top - VIEWPORT_MARGIN * 2;
      const maxHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(available, MAX_PANEL_HEIGHT));

      setStyle({ left, bottom, maxHeight });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
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
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={buttonClassName}
        title="View Queue"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
        </svg>
      </button>

      {open && style && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Queue"
          onClick={(e) => e.stopPropagation()}
          style={{ left: style.left, bottom: style.bottom, width: PANEL_WIDTH, maxHeight: style.maxHeight }}
          className="fixed z-[100] rounded-lg border border-gray-700 bg-[#181818] shadow-2xl flex flex-col overflow-hidden"
        >
          <QueueList className="h-full" />
        </div>,
        document.body
      )}
    </>
  );
}
