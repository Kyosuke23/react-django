import type { ReactNode } from "react";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

type Props<T> = {
  open: boolean;
  onClose: () => void;

  selected: T | null;

  // ナビゲーション（今ページ内）
  selectedIndex: number; // -1 のとき未選択
  rowsLength: number;
  hasPrev: boolean;
  hasNext: boolean;
  goPrev: () => void;
  goNext: () => void;

  /** Left side header texts */
  title?: ReactNode;
  subtitle?: ReactNode;

  children: ReactNode;

  isEditing: boolean;
  saving: boolean;

  // エラー
  saveError: string | null;
  fieldErrors: Record<string, string[]>;

  // 操作
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => void;

  // 削除済判定（受け取るデータ型がジェネリクス型のため）
  isDeleted?: (row: T) => boolean;

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

export default function SlideOver<T>({
  open,
  onClose,
  selected,
  selectedIndex,
  rowsLength,
  hasPrev,
  hasNext,
  goPrev,
  goNext,
  title,
  subtitle,
  children,
  isEditing,
  saving,
  saveError,
  fieldErrors,
  isDeleted,
  maxWidthClassName = "sm:max-w-md",
  panelClassName = "bg-slate-950 text-slate-100",
  headerClassName = "border-b border-slate-800",
  showCloseButton = true,
  startEdit,
  cancelEdit,
  saveEdit,
}: Props<T>) {
  useEscapeKey(open, onClose);
  const deleted = selected && isDeleted ? isDeleted(selected) : false;

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
          {(title || subtitle || showCloseButton) && (
            <div className={["px-4 py-3 flex items-center gap-3", headerClassName].join(" ")}>
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
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      type="button"
                      className="ui-btn-edit"
                      onClick={startEdit}
                      disabled={!selected || deleted}
                      title={deleted ? "削除済みは編集できません" : "編集"}
                    >
                      編集
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="ui-btn-cancel"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        キャンセル
                      </button>

                      <button
                        type="button"
                        className="ui-btn-save"
                        onClick={saveEdit}
                        disabled={saving}
                      >
                        {saving ? "保存中..." : "保存"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="p-4 space-y-3">
            {/* 前へ / 次へ */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="ui-btn-nav"
                onClick={goPrev}
                disabled={!hasPrev || isEditing}
                title={isEditing ? "編集中は移動できません" : "前の明細"}
              >
                ← 前の明細
              </button>

              <div className="text-xs text-slate-400">
                {selectedIndex >= 0 ? `${selectedIndex + 1} / ${rowsLength}` : ""}
              </div>

              <button
                type="button"
                className="ui-btn-nav"
                onClick={goNext}
                disabled={!hasNext || isEditing}
                title={isEditing ? "編集中は移動できません" : "次の明細"}
              >
                次の明細 →
              </button>
            </div>

            {fieldErrors.non_field_errors?.length ? (
              <pre className="ui-error-message">
                {fieldErrors.non_field_errors.join("\n")}
              </pre>
            ) : saveError ? (
              <pre className="ui-error-message">
                {saveError}
              </pre>
            ) : null}
          </div>
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </aside>
    </>
  );
}
