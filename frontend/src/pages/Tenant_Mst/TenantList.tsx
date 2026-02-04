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

/**
 * サーバ側（Django API）の ordering に渡すことを想定したソートキー。
 * - Django REST Framework の OrderingFilter 等とキーを一致させる前提。
 */
type SortKey =
  | "tenant_name"
  | "representative_name"
  | "email"
  | "tel_number"
  | "created_at"
  | "updated_at";

export default function TenantList() {
  // -----------------------------
  // フィルタ系 state
  // -----------------------------
  const [q, setQ] = useState(""); // 検索キーワード
  const [includeDeleted, setIncludeDeleted] = useState(false); // 削除済みも含めるか

  // -----------------------------
  // 一覧データ state
  // -----------------------------
  const [rows, setRows] = useState<Tenant[]>([]); // 一覧として表示するデータ配列
  const [selectedId, setSelectedId] = useState<number | null>(null); // 詳細表示対象のID

  // -----------------------------
  // ソート state（サーバソート前提）
  // -----------------------------
  const [sortKey, setSortKey] = useState<SortKey>("tenant_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // -----------------------------
  // ページング state
  // -----------------------------
  const [totalCount, setTotalCount] = useState(0); // 総件数（Pagination 表示用）
  const pager = usePagination({ pageSize: DEFAULT_PAGE_SIZE }); // 既存hook

  // 詳細スライドオーバーの開閉
  const detail = useDisclosure(false);

  /**
   * Django の OrderingFilter 等に渡す ordering 文字列を組み立てる
   * - asc: "tenant_name"
   * - desc: "-tenant_name"
   */
  const ordering = useMemo(() => {
    return sortDir === "asc" ? sortKey : `-${sortKey}`;
  }, [sortKey, sortDir]);

  /**
   * DataTable 側から「並び替えキー」が通知されたときの処理
   * - 同じキーを押したら asc/desc トグル
   * - 別のキーなら asc で開始
   */
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

  /**
   * selectedId から選択中の Tenant を引く
   * - rows が更新されたときにも追随する
   */
  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  /**
   * 行クリックで詳細を開く
   * - 選択IDをセットしてスライドオーバー open
   */
  const openDetail = useCallback(
    (t: Tenant) => {
      setSelectedId(t.id);
      detail.open();
    },
    [detail]
  );

  /**
   * 一覧再取得
   * - q / includeDeleted / ordering / page / page_size を渡して API から取得
   * - 表示用 rows と totalCount を更新
   * - 選択中の行が一覧から消えた（フィルタで除外された等）場合は詳細を閉じる
   *
   * TODO:
   * - API 例外時のエラーハンドリング（toast 等）を追加すると運用が安定
   */
  const reload = useCallback(async () => {
    const data = await listTenantsPaged({
      q,
      include_deleted: includeDeleted,
      ordering,
      page: pager.page,
      page_size: pager.pageSize,
    });

    setRows(data.items);
    setTotalCount(data.count);

    // 選択中行が一覧から消えた場合（フィルタで除外など）は詳細を閉じる
    if (selectedId && !data.items.some((r) => r.id === selectedId)) {
      setSelectedId(null);
      detail.close();
    }
  }, [q, includeDeleted, ordering, pager.page, pager.pageSize, selectedId, detail]);

  // 初回 + 依存変更時に一覧取得
  useEffect(() => {
    reload();
  }, [reload]);

  /**
   * フィルタ/ソート変更時は 1ページ目に戻す
   * NOTE:
   * 現状 setPage(1) はしておらず pager.reset() だけ呼んでいる。
   * もし page を useState で持つなら、ここで setPage(1) もしておくのが安全。
   */
  useEffect(() => {
    pager.reset();
  }, [q, includeDeleted, sortKey, sortDir]);

  /**
   * 削除（論理削除想定）
   * - confirm で誤操作を防止
   * - 実行後に reload
   */
  const onClickDelete = useCallback(
    async (id: number) => {
      if (!confirm("このテナントを削除しますか？")) return;
      await deleteTenant(id);
      await reload();
    },
    [reload]
  );

  /**
   * 復元（論理削除の取り消し）
   * - confirm → restore → reload
   */
  const onClickRestore = useCallback(
    async (id: number) => {
      if (!confirm("このテナントを復元しますか？")) return;
      await restoreTenant(id);
      await reload();
    },
    [reload]
  );

  /**
   * DataTable に渡すカラム定義
   * - sortKey を持つ列は DataTable 側のヘッダクリックで onSort が呼ばれる想定
   * - アクション列は行クリックを止めるため stopPropagation している（良い）
   */
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
            {/* 編集（未実装） */}
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

            {/* 削除 / 復元 */}
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

      {/* Toolbar: 検索・削除済み含む・（モバイル用ソート） */}
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

        {/* Mobile sort: スマホはテーブルヘッダが使いづらいので select でソート */}
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

      {/* Content: PC は DataTable、スマホはカード UI */}
      <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-[#0b1220] flex flex-col min-w-0">
        {/* Desktop table */}
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
            // 削除済みは薄く表示
            rowClassName={(t) => (t.is_deleted ? "opacity-60" : "")}
          />
          <Pagination
            page={pager.page}
            pageSize={DEFAULT_PAGE_SIZE}
            totalCount={totalCount}
            onPageChange={pager.setPage}
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

      {/* Detail slide-over: 選択行の詳細表示 */}
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
                <dd className="text-sm font-medium break-all">{selected.tenant_code}</dd>
              </div>

              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <dt className="text-xs text-slate-400 mb-1">代表者</dt>
                <dd className="text-sm">{selected.representative_name}</dd>
              </div>

              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <dt className="text-xs text-slate-400 mb-1">Email</dt>
                <dd className="text-sm break-all">{selected.email}</dd>
              </div>

              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <dt className="text-xs text-slate-400 mb-1">電話</dt>
                <dd className="text-sm">{selected.tel_number ?? "-"}</dd>
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