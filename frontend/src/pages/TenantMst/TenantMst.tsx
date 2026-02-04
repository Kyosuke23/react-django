import { useCallback, useEffect, useMemo, useState } from "react";
import type { Tenant, TenantUpdatePayload } from "../../lib/tenants";
import { listTenantsPaged, deleteTenant, restoreTenant, updateTenant } from "../../lib/tenants";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import DataTable from "../common/components/DataTable";
import type { SortDir } from "../common/components/DataTable";
import Pagination from "../common/components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { DEFAULT_PAGE_SIZE } from "../../constants/pagination";
import { useFlash } from "../common/components/Flash";
import TenantDetailSlideOver from "./components/TenantDetailSlideOver";

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

export default function TenantList() {
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
  const page = pager.page;
  const pageSize = pager.pageSize;
  const setPage = pager.setPage;

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
      setPage(1);
      if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey, setPage]
  );

  // -----------------------------
  // columns
  // -----------------------------
  const columns = useMemo(
    () => [
      {
        id: "tenant",
        label: "テナント",
        sortKey: "tenant_name",
        render: (t: Tenant) => (
          <div className="min-w-0">
            <div className="font-medium text-slate-100 truncate">{t.tenant_name}</div>
          </div>
        ),
      },
      {
        id: "rep",
        label: "代表者",
        sortKey: "representative_name",
        render: (t: Tenant) => t.representative_name,
      },
      {
        id: "email",
        label: "Email",
        sortKey: "email",
        render: (t: Tenant) => <span className="break-all">{t.email}</span>,
      },
      {
        id: "tel",
        label: "電話",
        sortKey: "tel_number",
        render: (t: Tenant) => t.tel_number ?? "-",
      },
      {
        id: "actions",
        label: "",
        render: (t: Tenant) => (
          <div className="flex items-center justify-end gap-2">
            <button
              className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-40"
              title="編集"
              disabled={t.is_deleted}
              onClick={(e) => {
                e.stopPropagation();
                openEdit(t);
              }}
            >
              <PencilSquareIcon className="h-5 w-5 text-slate-600" />
            </button>

            {!t.is_deleted ? (
              <button
                className="rounded-lg p-2 hover:bg-slate-100"
                title="削除"
                onClick={(e) => {
                  e.stopPropagation();
                  onClickDelete(t.id);
                }}
              >
                <TrashIcon className="h-5 w-5 text-rose-600" />
              </button>
            ) : (
              <button
                className="rounded-lg px-3 py-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onClickRestore(t.id);
                }}
              >
                復元
              </button>
            )}
          </div>
        ),
        thClassName: "text-right",
        tdClassName: "text-right",
      },
    ],
    [openEdit, onClickDelete, onClickRestore]
  );

  return (
    <div className="h-full flex flex-col min-h-0 gap-4 pb-4">
      <h1 className="text-2xl font-bold">テナントマスタ管理</h1>
      <div className="text-xs text-slate-400">テナント情報管理ページ</div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-96">
            <label className="block text-xs text-slate-300 mb-1">検索</label>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-white/10"
              placeholder="テナント名 / コード / Email / 電話…"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer mt-1 sm:mt-6">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4"
            />
            <span>削除済みを含める</span>
          </label>
        </div>

        {/* Mobile sort */}
        <div className="sm:hidden flex items-center gap-2">
          <select
            className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
            value={sortKey}
            onChange={(e) => {
              setSortKey(e.target.value as SortKey);
              setSortDir("asc");
              setPage(1);
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
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            onClick={() => {
              setSortDir((d) => (d === "asc" ? "desc" : "asc"));
              setPage(1);
            }}
            title="昇順/降順"
          >
            {sortDir === "asc" ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-[#0b1220] flex flex-col min-w-0">
        <div className="hidden sm:block flex-1 min-h-0">
          <DataTable<Tenant>
            rows={rows}
            columns={columns}
            className="h-full"
            rowKey={(t) => t.id}
            activeSortKey={sortKey}
            activeSortDir={sortDir}
            onSort={onSort}
            onRowClick={openDetail}
            rowClassName={(t) => (t.is_deleted ? "opacity-60" : "")}
          />
          <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden flex-1 min-h-0 overflow-auto space-y-2 pb-2">
          {rows.map((t) => (
            <button
              key={t.id}
              className={[
                "w-full text-left rounded-xl border border-slate-700/80 bg-slate-950/30 text-slate-100 p-3",
                "active:scale-[0.99] transition",
                t.is_deleted ? "opacity-60" : "",
              ].join(" ")}
              onClick={() => openDetail(t)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-200/900 truncate">{t.tenant_name}</div>
                  <div className="mt-2 text-xs text-slate-200/90 truncate">{t.email}</div>
                  <div className="text-xs text-slate-200/80">{t.tel_number ?? "-"}</div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[10px] rounded-full border border-slate-600/60 px-2 py-1 text-slate-200 bg-slate-900/30">
                    {t.is_deleted ? "削除済み" : "有効"}
                  </span>
                </div>
              </div>
            </button>
          ))}
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
