import { useCallback, useEffect, useMemo, useState } from "react";
import { type Partner, type PartnerUpdatePayload, buildQuery } from "../../lib/partners";
import { exportCSV } from "../../lib/io";
import { getYMDHMS } from "../../lib/api";
import { useRowNavigator } from "../../hooks/useRowNavigator";
import { listPartnersPaged, deletePartner, restorePartner, updatePartner, createPartner } from "../../lib/partners";
import DataTable from "../common/components/DataTable";
import type { SortDir } from "../common/components/DataTable";
import Pagination from "../common/components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { DEFAULT_PAGE_SIZE } from "../../constants/pagination";
import { useFlash } from "../common/components/Flash";
import { ColumnsTable } from "./components/ColumnsTable";
import DetailSlideOver from "./components/DetailSlideOver";
import { normalizeApiError } from "../../lib/errors";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

type SortKey =
  | "partner_name"
  | "partner_type"
  | "email"
  | "tel_number"
  | "created_at"
  | "updated_at";

type EditState = {
  partner_name: string;
  partner_name_kana: string;
  partner_type: Partner["partner_type"];
  contact_name: string;
  tel_number: string;
  email: string;
  postal_code: string;
  state: string;
  city: string;
  address: string;
  address2: string;
};

const emptyEdit: EditState = {
  partner_name: "",
  partner_name_kana: "",
  partner_type: "customer",
  contact_name: "",
  tel_number: "",
  email: "",
  postal_code: "",
  state: "",
  city: "",
  address: "",
  address2: "",
};

function toEditState(p: Partner): EditState {
  return {
    partner_name: p.partner_name ?? "",
    partner_name_kana: p.partner_name_kana ?? "",
    partner_type: p.partner_type ?? "customer",
    contact_name: p.contact_name ?? "",
    tel_number: p.tel_number ?? "",
    email: p.email ?? "",
    postal_code: p.postal_code ?? "",
    state: p.state ?? "",
    city: p.city ?? "",
    address: p.address ?? "",
    address2: p.address2 ?? "",
  };
}

function toUpdatePayload(e: EditState): PartnerUpdatePayload {
  return {
    partner_name: e.partner_name,
    partner_name_kana: e.partner_name_kana || null,
    partner_type: e.partner_type,
    contact_name: e.contact_name || null,
    tel_number: e.tel_number || null,
    email: e.email,
    postal_code: e.postal_code || null,
    state: e.state || null,
    city: e.city || null,
    address: e.address || null,
    address2: e.address2 || null,
  };
}

const PARTNER_TYPE_OPTIONS = ["", "customer", "supplier", "both"] as const;
type PartnerTypeFilter = (typeof PARTNER_TYPE_OPTIONS)[number];

export default function PartnerMst() {
  // -----------------------------
  // フィルタ
  // -----------------------------
  const [q, setQ] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [partnerType, setPartnerType] = useState<PartnerTypeFilter>("");

  // -----------------------------
  // 一覧（rows は今ページのみ）
  // -----------------------------
  const [rows, setRows] = useState<Partner[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
  const [sortKey, setSortKey] = useState<SortKey>("partner_name");
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
      const data = await listPartnersPaged({
        q,
        partner_type: partnerType || undefined,
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
  }, [q, partnerType, includeDeleted, ordering, page, pageSize, reloadToken, selectedId, close, flash]);

  // -----------------------------
  // 行クリック / 編集開始（アイコン）
  // -----------------------------
  const openDetail = useCallback(
    (p: Partner) => {
      setSelectedId(p.id);
      setIsCreating(false);
      setIsEditing(false);
      setSaveError(null);
      setFieldErrors({});
      open();
    }, [open]
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
    (p: Partner) => {
      setSelectedId(p.id);
      setIsCreating(false);
      setEdit(toEditState(p));
      setIsEditing(true);
      setSaveError(null);
      setFieldErrors({});
      open();
    }, [open]
  );

  // -----------------------------
  // 削除
  // -----------------------------
  const onClickDelete = useCallback(
    async (id: number) => {
      if (!confirm("この取引先を削除しますか？")) return;
      try {
        await deletePartner(id);
        bumpReload();
        flash.success("削除に成功しました");
      } catch (e: unknown) {
        const ne = normalizeApiError(e);
        console.error(ne.raw);
        flash.error(ne.message);
      }
    }, [bumpReload, flash]
  );

  // -----------------------------
  // 復元
  // -----------------------------
  const onClickRestore = useCallback(
    async (id: number) => {
      if (!confirm("この取引先を復元しますか？")) return;

      try {
        await restorePartner(id);
        bumpReload();
        flash.success("復元しました");
      } catch (e: unknown) {
        const ne = normalizeApiError(e);
        console.error(ne.raw);
        flash.error(ne.message);
      }
    }, [bumpReload, flash]
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
        await createPartner(toUpdatePayload(edit));
        setIsEditing(false);
        setIsCreating(false);
        setFieldErrors({});
        bumpReload();
        flash.success("登録しました");
        close();
        return;
      }

      if (!selectedId) return;
      await updatePartner(selectedId, toUpdatePayload(edit));
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
  // CSV出力処理
  // -----------------------------
  const onExportCsv = useCallback(async () => {
    try {
      const { blob, filename } = await exportCSV({
        path: "/api/partners/export",
        query: buildQuery({
          q,
          partner_type: partnerType || undefined,
          include_deleted: includeDeleted,
          ordering,
        }),
        filename: `partners_${getYMDHMS()}.csv`,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } catch (e) {
      const ne = normalizeApiError(e);
      console.error(ne.raw);
      flash.error(ne.message);
    }
  }, [q, partnerType, includeDeleted, ordering, flash]);

  // -----------------------------
  // レンダリング
  // -----------------------------
  return (
    <div className="ui-page">
      <h1 className="ui-page-title">取引先マスタ管理</h1>
      <div className="ui-page-desc">取引先情報管理ページ</div>

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
              placeholder="取引先名 / カナ / Email / 電話 / 担当者…"
            />
          </div>

          <div className="w-full sm:w-35">
            <label className="ui-field-label">取引先区分</label>
            <select
              value={partnerType}
              onChange={(e) => {
                const v = e.target.value;
                if (PARTNER_TYPE_OPTIONS.includes(v as PartnerTypeFilter)) {
                  setPartnerType(v as PartnerTypeFilter);
                  reset();
                }
              }}
              className="ui-select"
            >
              <option value="">すべて</option>
              <option value="customer">顧客</option>
              <option value="supplier">仕入先</option>
              <option value="both">顧客・仕入先</option>
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
            <button className="ui-btn-csv-dl" onClick={onExportCsv}>
              <ArrowDownTrayIcon className="ui-icon-hw">
                <span>CSV</span>
              </ArrowDownTrayIcon>
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
            <option value="partner_name">取引先名</option>
            <option value="partner_type">区分</option>
            <option value="email">Email</option>
            <option value="tel_number">電話</option>
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
          <DataTable<Partner>
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

        {/* Mobile cards */}
        <div className="ui-mobile-list">
          {rows.map((p) => {
            const address = [
              p.postal_code ? `〒${p.postal_code}` : null,
              p.state,
              p.city,
              p.address,
              p.address2,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={p.id}
                className={["ui-mobile-card", p.is_deleted ? "ui-is-deleted" : "",].join(" ")}
                onClick={() => openDetail(p)}
              >
                <div className="ui-mobile-card-content">
                  <div className="ui-mobile-card-row">
                    <div className="ui-mobile-card-value-main">{p.partner_name}</div>
                    <div className="ui-mobile-card-value-sub">{p.partner_name_kana}</div>
                    <div className="ui-mobile-card-value-sub">{p.email}</div>
                    <div className="ui-mobile-card-value-sub">{p.tel_number ?? "-"}</div>
                    {address && (
                      <div className="ui-mobile-card-value-sub" title={address}>
                        {address}
                      </div>
                    )}
                  </div>

                  <div className="ui-mobile-card-badge">
                    <span className="ui-badge-status">
                      {p.is_deleted ? "削除済み" : "有効"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
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
      />
    </div>
  );
}