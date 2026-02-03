import { useCallback, useEffect, useMemo, useState } from "react";
import type { Tenant } from "../../lib/tenants";
import { listTenantsPaged, deleteTenant, restoreTenant } from "../../lib/tenants";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import DataTable from "../../components/DataTable";
import type { SortDir } from "../../components/DataTable";
import SlideOver from "../../components/SlideOver";
import { useDisclosure } from "../../hooks/useDisclosure";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { DEFAULT_PAGE_SIZE } from "../../constants/pagination";

type SortKey =
  | "tenant_code"
  | "tenant_name"
  | "representative_name"
  | "email"
  | "tel_number"
  | "created_at"
  | "updated_at";

export default function TenantList() {
  const [q, setQ] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [rows, setRows] = useState<Tenant[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // --- sort state ---
  const [sortKey, setSortKey] = useState<SortKey>("tenant_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // --- Pagination ---
  const [page, setPage] = useState(1);
  const pageRows = useMemo(() => {
    const start = (page - 1) * DEFAULT_PAGE_SIZE;
    return rows.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [rows, page]);
  const [totalCount, setTotalCount] = useState(0);
  const pager = usePagination({ pageSize: DEFAULT_PAGE_SIZE });

  // slide-over open/close
  const detail = useDisclosure(false);

  const ordering = useMemo(() => {
    return sortDir === "asc" ? sortKey : `-${sortKey}`;
  }, [sortKey, sortDir]);

  const onSort = useCallback(
    (serverSortKey: string) => {
      const key = serverSortKey as SortKey;
      if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const openDetail = useCallback(
    (t: Tenant) => {
      setSelectedId(t.id);
      detail.open();
    },
    [detail]
  );

  const reload = useCallback(async () => {
    const data = await listTenantsPaged({
      q,
      include_deleted: includeDeleted,
      ordering,
      page,
      page_size: DEFAULT_PAGE_SIZE,
    });
    setRows(data.items);
    setTotalCount(data.count);

    // If selected row disappeared (filtered out), close panel.
    if (selectedId && !data.items.some((r) => r.id === selectedId)) {
      setSelectedId(null);
      detail.close();
    }
  }, [q, includeDeleted, ordering, selectedId, detail]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Reset to page 1 when filter/sort changes
  useEffect(() => {
    pager.reset();
  }, [q, includeDeleted, sortKey, sortDir]);

  const onClickDelete = useCallback(
    async (id: number) => {
      if (!confirm("このテナントを削除しますか？")) return;
      await deleteTenant(id);
      await reload();
    },
    [reload]
  );

  const onClickRestore = useCallback(
    async (id: number) => {
      if (!confirm("このテナントを復元しますか？")) return;
      await restoreTenant(id);
      await reload();
    },
    [reload]
  );

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
      { id: "rep", label: "代表者", sortKey: "representative_name", render: (t: Tenant) => t.representative_name },
      { id: "email", label: "Email", sortKey: "email", render: (t: Tenant) => <span className="break-all">{t.email}</span> },
      { id: "tel", label: "電話", sortKey: "tel_number", render: (t: Tenant) => t.tel_number ?? "-" },
      {
        id: "actions",
        label: "",
        render: (t: Tenant) => (
          <div className="flex items-center justify-end gap-2">
            <button
              className="rounded-lg p-2 hover:bg-slate-100"
              title="編集"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: 編集画面へ遷移（親で扱いたいなら onEdit を props 化する）
                alert("編集は未実装です");
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
    [onClickDelete, onClickRestore]
  );

  return (
    <div className="h-full flex flex-col min-h-0 gap-4 p-4">
      <h1 className="text-2xl font-bold">テナントマスタ管理</h1>
      <div className="text-xs text-slate-400">テナント情報管理ページ</div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* 検索 */}
          <div className="w-full sm:w-96">
            <label className="block text-xs text-slate-300 mb-1">検索</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-white/10"
              placeholder="テナント名 / コード / Email / 電話…"
            />
          </div>

          {/* 削除済みチェック */}
          <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer mt-1 sm:mt-6">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="h-4 w-4"
            />
            <span>削除済みを含める</span>
          </label>
        </div>

        {/* Mobile sort (optional) */}
        <div className="sm:hidden flex items-center gap-2">
          <select
            className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="tenant_name">テナント</option>
            <option value="representative_name">代表者</option>
            <option value="email">Email</option>
            <option value="tel_number">電話</option>
            <option value="created_at">作成日</option>
            <option value="updated_at">更新日</option>
          </select>
          <button
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            title="昇順/降順"
          >
            {sortDir === "asc" ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-[#0b1220] flex flex-col min-w-0">
        {/* Desktop table */}
        <div className="hidden sm:block flex-1 min-h-0">
          <DataTable<Tenant>
            rows={pageRows}
            columns={columns}
            className="h-full"
            rowKey={(t) => t.id}
            activeSortKey={sortKey}
            activeSortDir={sortDir}
            onSort={onSort}
            onRowClick={openDetail}
            rowClassName={(t) => (t.is_deleted ? "opacity-60" : "")}
          />
          <Pagination
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            totalCount={totalCount}
            onPageChange={setPage}
          />
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
      <SlideOver
        open={detail.isOpen}
        onClose={detail.close}
        subtitle="テナント詳細"
        title={selected?.tenant_name ?? ""}
      >
        <div className="p-4 space-y-3">
          {selected ? (
            <dl className="space-y-3">
              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <dt className="text-xs text-slate-400 mb-1">コード</dt>
                <dd className="text-sm font-medium break-all">
                  {selected.tenant_code}
                </dd>
              </div>

              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <dt className="text-xs text-slate-400 mb-1">代表者</dt>
                <dd className="text-sm">
                  {selected.representative_name}
                </dd>
              </div>

              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <dt className="text-xs text-slate-400 mb-1">Email</dt>
                <dd className="text-sm break-all">
                  {selected.email}
                </dd>
              </div>

              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <dt className="text-xs text-slate-400 mb-1">電話</dt>
                <dd className="text-sm">
                  {selected.tel_number ?? "-"}
                </dd>
              </div>

              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <dt className="text-xs text-slate-400 mb-1">住所</dt>
                <dd className="text-sm">
                  {[
                    selected.postal_code ? `〒${selected.postal_code}` : null,
                    selected.state,
                    selected.city,
                    selected.address,
                    selected.address2,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="text-sm text-slate-500">行を選択してください</div>
          )}
        </div>
      </SlideOver>
    </div>
  );
}