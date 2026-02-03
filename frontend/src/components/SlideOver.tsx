import type { ReactNode } from "react";
import { useEscapeKey } from "../hooks/useEscapeKey";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /**
   * Tailwind width classes for desktop. Mobile is always full width.
   * Example: "sm:max-w-md" (default)
   */
  maxWidthClassName?: string;

  /** Optional theme overrides */
  panelClassName?: string;
  headerClassName?: string;
};

export default function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClassName = "sm:max-w-md",
  panelClassName = "bg-slate-950 text-slate-100",
  headerClassName = "border-b border-slate-800",
}: Props) {
  useEscapeKey(open, onClose);

  return (
    <>
      {/* Overlay */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Panel */}
      <aside
        className={[
          "fixed top-0 right-0 z-50 h-dvh w-full shadow-xl",
          maxWidthClassName,
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
          panelClassName,
        ].join(" ")}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full flex flex-col">
          {(title || subtitle) && (
            <div className={["px-4 py-3 flex items-start justify-between gap-3", headerClassName].join(" ")}>
              <div className="min-w-0">
                {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
                {title && <div className="text-lg font-semibold truncate">{title}</div>}
              </div>
              <button
                className="shrink-0 rounded-lg px-3 py-1 text-sm hover:bg-white/10"
                onClick={onClose}
              >
                閉じる
              </button>
            </div>
          )}

          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </aside>
    </>
  );
}
