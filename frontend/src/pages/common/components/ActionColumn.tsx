import type { ReactNode } from "react";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

/**
 * あなたの columns が期待している型に合わせてください。
 * いまのコードを見る限り、この形でOKなはず。
 */
export type ColumnDefLike<T> = {
  id: string;
  label: string;
  render: (row: T) => ReactNode;
  thClassName?: string;
  tdClassName?: string;
};

type Options<T> = {
  /** 編集押下時 */
  onEdit: (row: T) => void;

  /** 削除押下時（idだけ欲しい場合は呼び出し側で row.id を取る） */
  onDelete: (row: T) => void;

  /** 復元押下時 */
  onRestore: (row: T) => void;

  /** 削除済み判定（デフォルト: row.is_deleted） */
  getIsDeleted?: (row: T) => boolean;

  /** 列のIDや表示、class を必要なら上書き */
  id?: string;
  label?: string;
  thClassName?: string;
  tdClassName?: string;

  /** stopPropagation を共通で制御したい場合 */
  stopPropagation?: boolean;
};

export function createActionColumn<T>({
  onEdit,
  onDelete,
  onRestore,
  getIsDeleted = (row: any) => Boolean(row?.is_deleted),
  id = "actions",
  label = "",
  thClassName = "text-right",
  tdClassName = "text-right",
  stopPropagation = true,
}: Options<T>): ColumnDefLike<T> {
  const guard = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  return {
    id,
    label,
    thClassName,
    tdClassName,
    render: (row: T) => {
      const isDeleted = getIsDeleted(row);

      return (
        <div className="flex items-center justify-end gap-2">
          <button
            className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-40"
            title="編集"
            disabled={isDeleted}
            onClick={(e) => {
              guard(e);
              onEdit(row);
            }}
          >
            <PencilSquareIcon className="h-5 w-5 text-slate-600" />
          </button>

          {!isDeleted ? (
            <button
              className="rounded-lg p-2 hover:bg-slate-100"
              title="削除"
              onClick={(e) => {
                guard(e);
                onDelete(row);
              }}
            >
              <TrashIcon className="h-5 w-5 text-rose-600" />
            </button>
          ) : (
            <button
              className="ui-btn-restore"
              onClick={(e) => {
                guard(e);
                onRestore(row);
              }}
            >
              復元
            </button>
          )}
        </div>
      );
    },
  };
}