import type { ReactNode } from "react";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

type Props = {
  open: boolean;
  onClose: () => void;

  /** Left side header texts */
  title?: ReactNode;
  subtitle?: ReactNode;

  /** Right side header actions (e.g. 編集/保存ボタン) */
  headerRight?: ReactNode;

  children: ReactNode;

  /**
   * Tailwind width classes for desktop. Mobile is always full width.
   * Example: "sm:max-w-md" (default)
   */
  maxWidthClassName?: string;

  /** Optional theme overrides */
  panelClassName?: string;
  headerClassName?: string;

  /** Close button control */
  showCloseButton?: boolean;
};

export default function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  headerRight,
  children,
  maxWidthClassName = "sm:max-w-md",
  panelClassName = "bg-slate-950 text-slate-100",
  headerClassName = "border-b border-slate-800",
  showCloseButton = true,
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
          {(title || subtitle || headerRight || showCloseButton) && (
            <div className={["px-4 py-3 flex items-start gap-3", headerClassName].join(" ")}>
              {/* Left */}
              <div className="min-w-0 flex-1">
                {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
                {title &&
                  (typeof title === "string" || typeof title === "number" ? (
                    <div className="text-lg font-semibold truncate">{title}</div>
                  ) : (
                    <div className="min-w-0">{title}</div>
                  ))}
              </div>

              {/* Right (actions + close) */}
              <div className="shrink-0 flex items-center gap-2">
                {headerRight}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </aside>
    </>
  );
}
