import { useCallback, useEffect, useMemo, useState } from "react";
import type { Tenant, TenantUpdatePayload } from "../../lib/tenants";
import { listTenantsPaged, deleteTenant, restoreTenant, updateTenant } from "../../lib/tenants";
import DataTable from "../common/components/DataTable";
import type { SortDir } from "../common/components/DataTable";
import Pagination from "../common/components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { DEFAULT_PAGE_SIZE } from "../../constants/pagination";
import { useFlash } from "../common/components/Flash";
import { ColumnsTable } from "./components/ColumnsTable";
import TenantDetailSlideOver from "./components/DetailSlideOver";

type SortKey =
  | "tenant_name"
  | "representative_name"
  | "email"
  | "tel_number"
  | "created_at"
  | "updated_at";

type EditState = {
  tenant_name: string;
  representative_name: string;
  email: string;
  tel_number: string;
  postal_code: string;
  state: string;
  city: string;
  address: string;
  address2: string;
};

const emptyEdit: EditState = {
  tenant_name: "",
  representative_name: "",
  email: "",
  tel_number: "",
  postal_code: "",
  state: "",
  city: "",
  address: "",
  address2: "",
};

function toEditState(t: Tenant): EditState {
  return {
    tenant_name: t.tenant_name ?? "",
    representative_name: t.representative_name ?? "",
    email: t.email ?? "",
    tel_number: t.tel_number ?? "",
    postal_code: t.postal_code ?? "",
    state: t.state ?? "",
    city: t.city ?? "",
    address: t.address ?? "",
    address2: t.address2 ?? "",
  };
}

function toUpdatePayload(e: EditState): TenantUpdatePayload {
  return {
    tenant_name: e.tenant_name,
    representative_name: e.representative_name,
    email: e.email,
    tel_number: e.tel_number || null,
    postal_code: e.postal_code || null,
    state: e.state || null,
    city: e.city || null,
    address: e.address || null,
    address2: e.address2 || null,
  };
}

export default function TenantMst() {
  // -----------------------------
  // フィルタ
  // -----------------------------
  const [q, setQ] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // -----------------------------
  // 一覧（rows は今ページのみ）
  // -----------------------------
  const [rows, setRows] = useState<Tenant[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
  const [sortKey, setSortKey] = useState<SortKey>("tenant_name");
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
  }, [selectedId, selected, isEditing]);

  // -----------------------------
  // 一覧取得（依存は「値」だけ + reloadToken）
  // -----------------------------
  useEffect(() => {
    let alive = true;

    (async () => {
      const data = await listTenantsPaged({
        q,
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
    })().catch(() => {
      // 必要なら toast / console.error
    });

    return () => {
      alive = false;
    };
  }, [q, includeDeleted, ordering, page, pageSize, reloadToken, selectedId, close]);

  // -----------------------------
  // 行クリック / 編集開始（アイコン）
  // -----------------------------
  const openDetail = useCallback(
    (t: Tenant) => {
      setSelectedId(t.id);
      setIsEditing(false);
      setSaveError(null);
      setFieldErrors({});
      open();
    },
    [open]
  );

  // -----------------------------
  // 編集画面起動
  // -----------------------------
  const openEdit = useCallback(
    (t: Tenant) => {
      setSelectedId(t.id);
      setEdit(toEditState(t));
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
      if (!confirm("このテナントを削除しますか？")) return;
      try {
        await deleteTenant(id);
        bumpReload();
        flash.success("削除に成功しました")
      } catch (e) {
        console.error(e);
        flash.error("削除に失敗しました")
      }
    },
    [bumpReload]
  );

  // -----------------------------
  // 復元
  // -----------------------------
  const onClickRestore = useCallback(async (id: number) => {
    if (!confirm("このテナントを復元しますか？")) return;

    try {
      await restoreTenant(id);
      bumpReload();
      flash.success("復元しました");
    } catch (e) {
      console.error(e);
      flash.error("復元に失敗しました");
    }
  }, [bumpReload, flash]);

  // -----------------------------
  // 前へ / 次へ（今ページのみ）
  // -----------------------------
  const selectedIndex = useMemo(() => {
    if (selectedId == null) return -1;
    return rows.findIndex((r) => r.id === selectedId);
  }, [rows, selectedId]);

  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < rows.length - 1;

  const goPrev = useCallback(() => {
    if (isEditing) return;
    if (!hasPrev) return;
    setSelectedId(rows[selectedIndex - 1].id);
  }, [isEditing, hasPrev, rows, selectedIndex]);

  const goNext = useCallback(() => {
    if (isEditing) return;
    if (!hasNext) return;
    setSelectedId(rows[selectedIndex + 1].id);
  }, [isEditing, hasNext, rows, selectedIndex]);

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
    if (!selected) {
      setIsEditing(false);
      setFieldErrors({});
      return;
    }
    setEdit(toEditState(selected));
    setIsEditing(false);
    setSaveError(null);
    setFieldErrors({});
  }, [selected]);

  const saveEdit = useCallback(async () => {
    if (!selectedId) return;

    setFieldErrors({});
    setSaving(true);
    setSaveError(null);

    try {
      await updateTenant(selectedId, toUpdatePayload(edit));
      setIsEditing(false);
      setFieldErrors({});
      bumpReload();
      flash.success("保存しました");
    } catch (e: any) {
      const data = e?.data;
      if (data && typeof data === "object") {
        setFieldErrors(data);
        setSaveError("入力項目に誤りがあります");
      } else {
        setSaveError(e?.message || "保存に失敗しました");
      }
    } finally {
      setSaving(false);
    }
  }, [selectedId, edit, bumpReload]);

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
    [sortKey, setPage]
  );

  // -----------------------------
  // 明細テーブル定義
  // -----------------------------
  const columns = ColumnsTable({openEdit, onClickDelete, onClickRestore});

  return (
    <div className="ui-page">
      <h1 className="ui-page-title">テナントマスタ管理</h1>
      <div className="ui-page-desc">テナント情報管理ページ</div>

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
              placeholder="テナント名 / コード / Email / 電話…"
            />
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
            <option value="tenant_name">テナント名称</option>
            <option value="representative_name">代表者</option>
            <option value="email">Email</option>
            <option value="tel_number">電話</option>
            <option value="created_at">作成日</option>
            <option value="updated_at">更新日</option>
          </select>
          <button
            className="ui-mobile-sort-btn"
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
          <DataTable<Tenant>
            rows={rows}
            columns={columns}
            className="h-full"
            rowKey={(t) => t.id}
            activeSortKey={sortKey}
            activeSortDir={sortDir}
            onSort={onSort}
            onRowClick={openDetail}
            rowClassName={(t) => (t.is_deleted ? "ui-is-deleted" : "")}
          />
          <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
        </div>

        {/* Mobile cards */}
        <div className="ui-mobile-list">
          {rows.map((t) => {
            const address = [
              t.postal_code ? `〒${t.postal_code}` : null,
              t.state,
              t.city,
              t.address,
              t.address2,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={t.id}
                className={["ui-mobile-card", t.is_deleted ? "ui-is-deleted" : "",].join(" ")}
                onClick={() => openDetail(t)}
              >
                <div className="ui-mobile-card-content">
                  <div className="ui-mobile-card-row">
                    <div className="ui-mobile-card-value-main">{t.tenant_name}</div>
                    <div className="ui-mobile-card-value-sub">{t.email}</div>
                    <div className="ui-mobile-card-value-sub">{t.tel_number ?? "-"}</div>
                    {address && (
                      <div className="ui-mobile-card-value-sub" title={address}>
                        {address}
                      </div>
                    )}
                  </div>

                  <div className="ui-mobile-card-badge">
                    <span className="ui-badge-status">
                      {t.is_deleted ? "削除済み" : "有効"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail slide-over */}
      <TenantDetailSlideOver
        open={detailOpen}
        onClose={() => {
          setIsEditing(false);
          setSaveError(null);
          setFieldErrors({});
          close();
        }}
        selected={selected}
        selectedIndex={selectedIndex}
        rowsLength={rows.length}
        hasPrev={hasPrev}
        hasNext={hasNext}
        goPrev={goPrev}
        goNext={goNext}
        isEditing={isEditing}
        saving={saving}
        edit={edit}
        setEdit={setEdit}
        saveError={saveError}
        fieldErrors={fieldErrors}
        startEdit={startEdit}
        cancelEdit={cancelEdit}
        saveEdit={saveEdit}
      />
    </div>
  );
}
