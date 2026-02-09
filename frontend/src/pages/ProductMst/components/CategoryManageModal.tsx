import { useCallback, useEffect, useState, useRef } from "react";
import DataTable from "../../common/components/DataTable";
import type { SortDir } from "../../common/components/DataTable";
import Pagination from "../../common/components/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { DEFAULT_PAGE_SIZE } from "../../../constants/pagination";
import { useFlash } from "../../common/components/Flash";
import { normalizeApiError } from "../../../lib/errors";
import {
  type ProductCategory,
  type ProductCategoryPayload,
  listProductCategoriesPaged,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  restoreProductCategory,
} from "../../../lib/productCategories";
import { createActionColumn } from "../../common/components/ActionColumn";

type SortKey = "product_category_name" | "sort" | "created_at" | "updated_at";

type EditState = {
  product_category_name: string;
};

const emptyEdit: EditState = { product_category_name: "" };

function toEditState(c: ProductCategory): EditState {
  return {
    product_category_name: c.product_category_name ?? "",
  };
}

function toPayload(e: EditState): ProductCategoryPayload {
  return {
    product_category_name: e.product_category_name,
  };
}

function modalOverlay(onClose: () => void) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

export default function CategoryManageModal(props: {
  open: boolean;
  onClose: () => void;
  onClosed?: () => void; // 閉じた後に choices 再読込したい時に使う
}) {
  const { open, onClose, onClosed } = props;

  const flash = useFlash();
  const flashRef = useRef(flash);
  useEffect(() => {
    flashRef.current = flash;
  });

  // フィルタ
  const [q, setQ] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // 一覧
  const [rows, setRows] = useState<ProductCategory[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // ソート
  const [sortKey, setSortKey] = useState<SortKey>("product_category_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const ordering = sortDir === "asc" ? sortKey : `-${sortKey}`;

  // ページング
  const pager = usePagination({ pageSize: DEFAULT_PAGE_SIZE });
  const { page, pageSize, setPage, reset } = pager;

  // 再取得
  const [reloadToken, setReloadToken] = useState(0);
  const bumpReload = useCallback(() => setReloadToken((t) => t + 1), []);

  // 新規/編集
  const [selected, setSelected] = useState<ProductCategory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [edit, setEdit] = useState<EditState>(emptyEdit);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // open した時に初期化
  useEffect(() => {
    if (!open) return;
    setQ("");
    setIncludeDeleted(false);
    setSelected(null);
    setIsEditing(false);
    setIsCreating(false);
    setEdit(emptyEdit);
    setSaving(false);
    setSaveError(null);
    setFieldErrors({});
    reset();
  }, [open, reset]);

  // 一覧取得
  useEffect(() => {
    if (!open) return;

    let alive = true;
    (async () => {
      const data = await listProductCategoriesPaged({
        q,
        include_deleted: includeDeleted,
        ordering,
        page,
        page_size: pageSize,
      });

      if (!alive) return;

      setRows(data.items);
      setTotalCount(data.count);

      // 選択中が一覧から消えたら解除
      if (selected && !data.items.some((r) => r.id === selected.id)) {
        setSelected(null);
        setIsEditing(false);
        setIsCreating(false);
        setEdit(emptyEdit);
        setSaveError(null);
        setFieldErrors({});
      }
    })().catch((e) => {
      console.error(e);
      flashRef.current.error("カテゴリ一覧の取得に失敗しました");
    });

    return () => {
      alive = false;
    };
  }, [open, q, includeDeleted, ordering, page, pageSize, reloadToken, selected]);

  // 閉じる（onClosedを呼ぶ）
  const close = useCallback(() => {
    onClose();
    onClosed?.();
  }, [onClose, onClosed]);

  // 行クリック（詳細表示）
  const onRowClick = useCallback((c: ProductCategory) => {
    setSelected(c);
    setIsCreating(false);
    setIsEditing(false);
    setEdit(toEditState(c));
    setSaveError(null);
    setFieldErrors({});
  }, []);

  // 新規作成開始
  const openCreate = useCallback(() => {
    setSelected(null);
    setIsCreating(true);
    setIsEditing(true);
    setEdit(emptyEdit);
    setSaveError(null);
    setFieldErrors({});
  }, []);

  // 編集開始
  const startEdit = useCallback(() => {
    if (!selected) return;
    if (selected.is_deleted) return;
    setIsCreating(false);
    setIsEditing(true);
    setEdit(toEditState(selected));
    setSaveError(null);
    setFieldErrors({});
  }, [selected]);

  // キャンセル
  const cancelEdit = useCallback(() => {
    if (isCreating) {
      setIsCreating(false);
      setIsEditing(false);
      setEdit(emptyEdit);
      setSaveError(null);
      setFieldErrors({});
      return;
    }
    if (!selected) {
      setIsEditing(false);
      return;
    }
    setIsEditing(false);
    setEdit(toEditState(selected));
    setSaveError(null);
    setFieldErrors({});
  }, [isCreating, selected]);

  // 保存
  const saveEdit = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    setFieldErrors({});

    try {
      const payload = toPayload(edit);

      if (isCreating) {
        await createProductCategory(payload);
        flash.success("カテゴリを登録しました");
        setIsCreating(false);
        setIsEditing(false);
        setEdit(emptyEdit);
        bumpReload();
        return;
      }

      if (!selected) return;
      await updateProductCategory(selected.id, payload);
      flash.success("カテゴリを保存しました");
      setIsEditing(false);
      bumpReload();
    } catch (e: unknown) {
      const ne = normalizeApiError(e);
      console.error(ne.raw);
      if (ne.fieldErrors) setFieldErrors(ne.fieldErrors);
      setSaveError(ne.message);
    } finally {
      setSaving(false);
    }
  }, [edit, isCreating, selected, bumpReload, flash]);

  // 削除
  const onClickDelete = useCallback(
    async (c: ProductCategory) => {
      if (!confirm("このカテゴリを削除しますか？")) return;
      try {
        await deleteProductCategory(c.id);
        flash.success("削除しました");
        bumpReload();
      } catch (e: unknown) {
        const ne = normalizeApiError(e);
        console.error(ne.raw);
        flash.error(ne.message);
      }
    },
    [bumpReload, flash]
  );

  // 復元
  const onClickRestore = useCallback(
    async (c: ProductCategory) => {
      if (!confirm("このカテゴリを復元しますか？")) return;
      try {
        await restoreProductCategory(c.id);
        flash.success("復元しました");
        bumpReload();
      } catch (e: unknown) {
        const ne = normalizeApiError(e);
        console.error(ne.raw);
        flash.error(ne.message);
      }
    },
    [bumpReload, flash]
  );

  // ソート（PartnerMstと同じ挙動）
  const onSort = useCallback(
    (serverSortKey: string) => {
      const key = serverSortKey as SortKey;
      reset();
      if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [reset, sortKey]
  );

  if (!open) return null;

  const columns = [
    {
      id: "name",
      label: "カテゴリ名",
      sortKey: "product_category_name",
      render: (c: ProductCategory) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{c.product_category_name}</div>
        </div>
      ),
    },
    // Action列（共通部品）
    createActionColumn<ProductCategory>({
      onEdit: (c) => {
        setSelected(c);
        setIsCreating(false);
        setIsEditing(true);
        setEdit(toEditState(c));
        setSaveError(null);
        setFieldErrors({});
      },
      onDelete: (c) => onClickDelete(c),
      onRestore: (c) => onClickRestore(c),

      // 任意：th/tdを右寄せに合わせる（createActionColumn の既定と同じなら不要）
      thClassName: "text-right",
      tdClassName: "text-right",
    }),
  ];

  const rightTitle = isCreating ? "新規カテゴリ" : isEditing ? "カテゴリ編集" : "カテゴリ詳細";

  return (
    <>
      {modalOverlay(close)}

      {/* 画面いっぱいに取りつつ、SPは上下スクロールで破綻しない */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div
          className={[
            "w-full",
            "max-w-6xl",
            "max-h-[92vh] sm:max-h-[88vh]",
            "overflow-hidden",
            "rounded-2xl",
            "border border-white/10",
            "bg-slate-950/80",
            "shadow-2xl",
          ].join(" ")}
        >
          {/* Header（スクロールしても見えるように） */}
          <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-base font-semibold text-slate-100 sm:text-lg">カテゴリ管理</div>
                <div className="text-xs text-slate-400">商品カテゴリのCRUD（補助マスタ）</div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button className="ui-btn-cancel" onClick={close}>
                  キャンセル
                </button>
                <button className="ui-btn-create" onClick={openCreate}>
                  新規登録
                </button>
              </div>
            </div>
          </div>

          {/* Body（ここだけスクロール） */}
          <div className="max-h-[calc(92vh-56px)] overflow-auto p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Left: list */}
              <div className="lg:col-span-2">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex-1">
                    <label className="ui-field-label text-slate-300">検索</label>
                    <input
                      className="ui-input-keyword w-full"
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value);
                        reset();
                      }}
                      placeholder="カテゴリ名…"
                    />
                  </div>

                  <label className="ui-checkbox-row text-slate-200">
                    <input
                      type="checkbox"
                      className="ui-checkbox"
                      checked={includeDeleted}
                      onChange={(e) => {
                        setIncludeDeleted(e.target.checked);
                        reset();
                      }}
                    />
                    <span>削除済みを含める</span>
                  </label>
                </div>

                <div className="ui-panel min-h-[320px] sm:min-h-[380px]">
                  <div className="ui-table-area">
                    <DataTable<ProductCategory>
                      rows={rows}
                      columns={columns}
                      rowKey={(c) => c.id}
                      activeSortKey={sortKey}
                      activeSortDir={sortDir}
                      onSort={onSort}
                      onRowClick={onRowClick}
                      rowClassName={(c) => (c.is_deleted ? "ui-is-deleted" : "")}
                    />
                    <Pagination
                      page={page}
                      pageSize={DEFAULT_PAGE_SIZE}
                      totalCount={totalCount}
                      onPageChange={setPage}
                    />
                  </div>
                </div>
              </div>

              {/* Right: detail/edit（SPは下に回る） */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-200">{rightTitle}</div>

                  {saveError ? (
                    <div className="mb-3 rounded-lg border border-red-400/30 bg-red-500/10 p-2 text-sm text-red-200">
                      {saveError}
                    </div>
                  ) : null}

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="ui-label text-slate-300">カテゴリ名</label>
                        <input
                          className="ui-input w-full"
                          value={edit.product_category_name}
                          onChange={(e) =>
                            setEdit((p) => ({ ...p, product_category_name: e.target.value }))
                          }
                          disabled={saving}
                        />
                        {fieldErrors.product_category_name?.length ? (
                          <div className="mt-1 text-xs text-red-300">
                            {fieldErrors.product_category_name.join(" / ")}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button className="ui-btn flex-1" onClick={cancelEdit} disabled={saving}>
                          キャンセル
                        </button>
                        <button className="ui-btn-create flex-1" onClick={saveEdit} disabled={saving}>
                          {saving ? "保存中…" : "保存"}
                        </button>
                      </div>
                    </div>
                  ) : selected ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs text-slate-400">カテゴリ名</div>
                        <div className="font-medium text-slate-100">{selected.product_category_name}</div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button className="ui-btn flex-1" onClick={startEdit} disabled={selected.is_deleted}>
                          編集
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-300">
                      一覧からカテゴリを選択するか、「新規」を押してください。
                    </div>
                  )}
                </div>

                {/* SPのときに「右ペインが下に来た」ことが分かりやすいよう余白 */}
                <div className="h-2 lg:hidden" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}