import type { ReactNode } from "react";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

/**
 * 明細ナビゲーションプロパティ
 */
export type NavProps = {
  selectedIndex: number; // -1 のとき未選択
  rowsLength: number;
  hasPrev: boolean;
  hasNext: boolean;
  goPrev: () => void;
  goNext: () => void;
};

/**
 * 編集状態プロパティ
 */
export type EditProps = {
  isEditing: boolean;
  saving: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => void;
};

/**
 * フィールドエラープロパティ
 */
export type ErrorsProps = {
  saveError: string | null;
  fieldErrors: Record<string, string[]>;
};

/**
 * 汎用プロパティ
 */
type Props<T> = {
  open: boolean;
  onClose: () => void;
  selected: T | null;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;

  nav: NavProps;
  edit: EditProps;
  errors: ErrorsProps;

  isDeleted?: (row: T) => boolean;
  maxWidthClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  showCloseButton?: boolean;
};

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-rose-400">{messages.join(", ")}</p>;
}

export default function SlideOver<T>({
  open,
  onClose,
  selected,
  title,
  subtitle,
  children,
  nav,
  edit,
  errors,
  isDeleted,
  maxWidthClassName = "sm:max-w-md",
  panelClassName = "bg-slate-950 text-slate-100",
  headerClassName = "border-b border-slate-800",
  showCloseButton = true,
}: Props<T>) {
  useEscapeKey(open, onClose);

  const deleted = selected && isDeleted ? isDeleted(selected) : false;

  const { selectedIndex, rowsLength, hasPrev, hasNext, goPrev, goNext } = nav;
  const { isEditing, saving, startEdit, cancelEdit, saveEdit } = edit;
  const { saveError, fieldErrors } = errors;

  const nonField = fieldErrors.non_field_errors ?? [];

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

              {/* Right (actions) */}
              <div className="shrink-0 flex items-center gap-2">
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
          )}

          {/* Body */}
          <div className="flex-1 overflow-auto">{children}</div>

          {/* Footer: nav + errors（← ここが “見た目が整う” ポイント） */}
          <div className="shrink-0 border-t border-slate-800 p-4 space-y-3">
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

            {nonField.length ? (
              <pre className="ui-error-message">{nonField.join("\n")}</pre>
            ) : saveError ? (
              <pre className="ui-error-message">{saveError}</pre>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}