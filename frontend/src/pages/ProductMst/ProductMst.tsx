import { useCallback, useEffect, useMemo, useState } from "react";
import type { SortDir } from "../common/components/DataTable";
import DataTable from "../common/components/DataTable";
import Pagination from "../common/components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { DEFAULT_PAGE_SIZE } from "../../constants/pagination";
import { useFlash } from "../common/components/Flash";
import { useRowNavigator } from "../../hooks/useRowNavigator";
import { normalizeApiError } from "../../lib/errors";

import {
  type Product,
  type ProductPayload,
  listProductsPaged,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
} from "../../lib/products";

import { listProductCategoryChoices, type CategoryChoice } from "../../lib/productCategories";
import CategoryManageModal from "./components/CategoryManageModal";
import { ColumnsTable } from "./components/ColumnsTable";
import DetailSlideOver from "./components/DetailSlideOver";

type SortKey = "product_name" | "unit_price" | "created_at" | "updated_at";

type EditState = {
  product_name: string;
  product_category: number | "";
  unit_price: string;
  description: string;
};

const emptyEdit: EditState = {
  product_name: "",
  product_category: "",
  unit_price: "",
  description: "",
};

function toEditState(p: Product): EditState {
  return {
    product_name: p.product_name ?? "",
    product_category: p.product_category ?? "",
    unit_price: p.unit_price != null ? String(p.unit_price) : "",
    description: p.description ?? "",
  };
}

function toPayload(e: EditState): ProductPayload {
  return {
    product_name: e.product_name,
    product_category: e.product_category === "" ? null : e.product_category,
    unit_price: e.unit_price === "" ? null : Number(e.unit_price),
    description: e.description || null,
  };
}

export default function ProductMst() {
  // -----------------------------
  // フィルタ
  // -----------------------------
  const [q, setQ] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [categoryId, setCategoryId] = useState<number | "">("");

  // -----------------------------
  // 一覧（rows は今ページのみ）
  // -----------------------------
  const [rows, setRows] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // -----------------------------
  // カテゴリ choices
  // -----------------------------
  const [categoryChoices, setCategoryChoices] = useState<CategoryChoice[]>([]);

  const reloadCategoryChoices = useCallback(async () => {
    const choices = await listProductCategoryChoices();
    setCategoryChoices(choices);
  }, []);

  useEffect(() => {
    reloadCategoryChoices().catch((e) => {
      console.error(e);
    });
  }, [reloadCategoryChoices]);

  // -----------------------------
  // 登録
  // -----------------------------
  const [isCreating, setIsCreating] = useState(false);

  // -----------------------------
  // 編集
  // -----------------------------
  const [isEditing, setIsEditing] = useState(false);
  const [edit, setEdit] = useState<EditState>(emptyEdit);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // -----------------------------
  // バリデーション（サーバ側）
  // -----------------------------
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // -----------------------------
  // ソート
  // -----------------------------
  const [sortKey, setSortKey] = useState<SortKey>("product_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const ordering = useMemo(() => {
    return sortDir === "asc" ? sortKey : `-${sortKey}`;
  }, [sortKey, sortDir]);

  // -----------------------------
  // ページング
  // -----------------------------
  const pager = usePagination({ pageSize: DEFAULT_PAGE_SIZE });
  const { page, pageSize, setPage, reset } = pager;

  // -----------------------------
  // フラッシュメッセージ
  // -----------------------------
  const flash = useFlash();

  // -----------------------------
  // SlideOver（この画面は useState で安定化）
  // -----------------------------
  const [detailOpen, setDetailOpen] = useState(false);
  const open = useCallback(() => setDetailOpen(true), []);
  const close = useCallback(() => setDetailOpen(false), []);

  // -----------------------------
  // 商品カテゴリ管理モーダル
  // -----------------------------
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // -----------------------------
  // 再取得トリガ
  // -----------------------------
  const [reloadToken, setReloadToken] = useState(0);
  const bumpReload = useCallback(() => setReloadToken((t) => t + 1), []);

  // -----------------------------
  // selected
  // -----------------------------
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  /**
   * 選択行が変わったら edit を初期化
   * - ★編集中は rows 更新が入っても edit を上書きしない（入力が消えるのを防止）
   */
  useEffect(() => {
    // 新規登録中は選択データがなくても編集状態を維持
    if (isCreating) return;

    if (!selected) {
      setEdit(emptyEdit);
      setSaveError(null);
      setIsEditing(false);
      setFieldErrors({});
      return;
    }
    if (isEditing) return;

    setEdit(toEditState(selected));
    setSaveError(null);
    setFieldErrors({});
  }, [selectedId, selected, isEditing, isCreating]);

  // -----------------------------
  // 一覧取得（依存は「値」だけ + reloadToken）
  // -----------------------------
  useEffect(() => {
    let alive = true;

    (async () => {
      const data = await listProductsPaged({
        q,
        product_category: categoryId === "" ? undefined : categoryId,
        include_deleted: includeDeleted,
        ordering,
        page,
        page_size: pageSize,
      });

      if (!alive) return;

      setRows(data.items);
      setTotalCount(data.count);

      // 選択中行が今ページから消えたら閉じる（ページ移動/フィルタ変更/削除など）
      if (selectedId && !data.items.some((r) => r.id === selectedId)) {
        setSelectedId(null);
        setIsEditing(false);
        setSaveError(null);
        setFieldErrors({});
        close();
      }
    })().catch((e) => {
      console.error(e);
      flash.error("一覧の取得に失敗しました");
    });

    return () => {
      alive = false;
    };
  }, [q, categoryId, includeDeleted, ordering, page, pageSize, reloadToken, selectedId, close, flash]);

  // -----------------------------
  // 行クリック / 編集開始（アイコン）
  // -----------------------------
  const openDetail = useCallback(
    (p: Product) => {
      setSelectedId(p.id);
      setIsCreating(false);
      setIsEditing(false);
      setSaveError(null);
      setFieldErrors({});
      open();
    },
    [open]
  );

  // -----------------------------
  // 登録画面起動
  // -----------------------------
  const openCreate = useCallback(() => {
    setSelectedId(null);
    setEdit(emptyEdit);
    setIsCreating(true);
    setIsEditing(true);
    setSaveError(null);
    setFieldErrors({});
    open();
  }, [open]);

  // -----------------------------
  // 編集画面起動
  // -----------------------------
  const openEdit = useCallback(
    (p: Product) => {
      setSelectedId(p.id);
      setIsCreating(false);
      setEdit(toEditState(p));
      setIsEditing(true);
      setSaveError(null);
      setFieldErrors({});
      open();
    },
    [open]
  );

  // -----------------------------
  // 削除
  // -----------------------------
  const onClickDelete = useCallback(
    async (id: number) => {
      if (!confirm("この商品を削除しますか？")) return;
      try {
        await deleteProduct(id);
        bumpReload();
        flash.success("削除に成功しました");
      } catch (e: unknown) {
        const ne = normalizeApiError(e);
        console.error(ne.raw);
        flash.error(ne.message);
      }
    },
    [bumpReload, flash]
  );

  // -----------------------------
  // 復元
  // -----------------------------
  const onClickRestore = useCallback(
    async (id: number) => {
      if (!confirm("この商品を復元しますか？")) return;

      try {
        await restoreProduct(id);
        bumpReload();
        flash.success("復元しました");
      } catch (e: unknown) {
        const ne = normalizeApiError(e);
        console.error(ne.raw);
        flash.error(ne.message);
      }
    },
    [bumpReload, flash]
  );

  // -----------------------------
  // 明細行移動（詳細表示）
  // -----------------------------
  const { selectedIndex, hasPrev, hasNext, goPrev, goNext } = useRowNavigator({
    rows,
    getId: (p) => p.id,
    selectedId,
    setSelectedId,
    canNavigate: !isEditing,
  });

  // -----------------------------
  // 編集：開始/キャンセル/保存（詳細内ボタン）
  // -----------------------------
  const startEdit = useCallback(() => {
    if (!selected) return;
    if (selected.is_deleted) return;
    setEdit(toEditState(selected));
    setIsEditing(true);
    setSaveError(null);
    setFieldErrors({});
  }, [selected]);

  const cancelEdit = useCallback(() => {
    // 新規登録キャンセル：閉じて初期化
    if (isCreating) {
      setIsEditing(false);
      setIsCreating(false);
      setEdit(emptyEdit);
      setSaveError(null);
      setFieldErrors({});
      close();
      return;
    }

    if (!selected) {
      setIsEditing(false);
      setFieldErrors({});
      return;
    }

    setEdit(toEditState(selected));
    setIsEditing(false);
    setSaveError(null);
    setFieldErrors({});
  }, [selected, isCreating, close]);

  const saveEdit = useCallback(async () => {
    setFieldErrors({});
    setSaving(true);
    setSaveError(null);

    try {
      if (isCreating) {
        await createProduct(toPayload(edit));
        setIsEditing(false);
        setIsCreating(false);
        setFieldErrors({});
        bumpReload();
        flash.success("登録しました");
        close();
        return;
      }

      if (!selectedId) return;
      await updateProduct(selectedId, toPayload(edit));
      setIsEditing(false);
      setFieldErrors({});
      bumpReload();
      flash.success("保存しました");
    } catch (e: unknown) {
      const ne = normalizeApiError(e);
      if (ne.fieldErrors) setFieldErrors(ne.fieldErrors);
      setSaveError(ne.message);
    } finally {
      setSaving(false);
    }
  }, [isCreating, selectedId, edit, bumpReload, flash, close]);

  // -----------------------------
  // ソート：変更時は必ず 1ページ目へ
  // -----------------------------
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
    [sortKey, reset]
  );

  // -----------------------------
  // 明細テーブル定義
  // -----------------------------
  const columns = ColumnsTable({ openEdit, onClickDelete, onClickRestore });

  // -----------------------------
  // カテゴリ管理（モーダル/SlideOver）
  // -----------------------------
  const onOpenCategoryManage = useCallback(() => {
    setCategoryModalOpen(true);
  }, []);

  // -----------------------------
  // レンダリング
  // -----------------------------
  return (
    <div className="ui-page">
      <h1 className="ui-page-title">商品マスタ管理</h1>
      <div className="ui-page-desc">商品情報管理ページ</div>

      {/* Toolbar */}
      <div className="ui-toolbar">
        <div className="ui-toolbar-left">
          <div className="ui-field-search">
            <label className="ui-field-label">検索</label>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                reset();
              }}
              className="ui-input-keyword"
              placeholder="商品名 / 商品カテゴリ名称"
            />
          </div>

          <div className="w-full sm:w-40">
            <label className="ui-field-label">カテゴリ</label>
            <select
              value={categoryId}
              onChange={(e) => {
                const v = e.target.value;
                setCategoryId(v === "" ? "" : Number(v));
                reset();
              }}
              className="ui-select"
            >
              <option value="">すべて</option>
              {categoryChoices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.product_category_name}
                </option>
              ))}
            </select>
          </div>

          <label className="ui-checkbox-row">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.target.checked);
                reset();
              }}
              className="ui-checkbox"
            />
            <span>削除済みを含める</span>
          </label>
        </div>

        <div className="ui-toolbar-right flex items-center gap-3">
          <button className="ui-btn-aux" onClick={onOpenCategoryManage}>
            カテゴリ管理
          </button>
          <button className="ui-btn-create" onClick={openCreate}>
            新規登録
          </button>
        </div>

        {/* Mobile sort */}
        <div className="ui-mobile-sort-area">
          <select
            className="ui-mobile-sort-select"
            value={sortKey}
            onChange={(e) => {
              setSortKey(e.target.value as SortKey);
              setSortDir("asc");
              reset();
            }}
          >
            <option value="product_name">商品名</option>
            <option value="unit_price">単価</option>
            <option value="created_at">作成日</option>
            <option value="updated_at">更新日</option>
          </select>
          <button
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            onClick={() => {
              setSortDir((d) => (d === "asc" ? "desc" : "asc"));
              reset();
            }}
            title="昇順/降順"
          >
            {sortDir === "asc" ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="ui-panel">
        <div className="ui-table-area">
          <DataTable<Product>
            rows={rows}
            columns={columns}
            className="h-full"
            rowKey={(p) => p.id}
            activeSortKey={sortKey}
            activeSortDir={sortDir}
            onSort={onSort}
            onRowClick={openDetail}
            rowClassName={(p) => (p.is_deleted ? "ui-is-deleted" : "")}
          />
          <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
        </div>

        {/* Mobile cards（必要なら後で） */}
      </div>

      {/* Detail slide-over */}
      <DetailSlideOver
        open={detailOpen}
        onClose={() => {
          setIsCreating(false);
          setIsEditing(false);
          setSaveError(null);
          setFieldErrors({});
          close();
        }}
        selected={selected}
        nav={{ selectedIndex, rowsLength: rows.length, hasPrev, hasNext, goPrev, goNext }}
        edit={{ isEditing, saving, startEdit, cancelEdit, saveEdit }}
        errors={{ saveError, fieldErrors }}
        form={{ editState: edit, setEdit }}
        categoryChoices={categoryChoices}
      />

      {/* 商品カテゴリマスタ管理 */}
      <CategoryManageModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onClosed={() => {
          reloadCategoryChoices().catch((e) => console.error(e));
        }}
      />
    </div>
  );
}