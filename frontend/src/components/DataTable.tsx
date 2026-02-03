import type { ReactNode } from "react";

export type SortDir = "asc" | "desc";

export type Column<T> = {
  id: string; // unique id in the screen
  label: ReactNode;
  /** Key used for server-side ordering (DRF ordering), e.g. "tenant_name" */
  sortKey?: string;
  /** Header alignment / padding etc */
  thClassName?: string;
  tdClassName?: string;
  /** Render a cell */
  render: (row: T) => ReactNode;
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  /** current sortKey (server key) */
  activeSortKey?: string;
  activeSortDir?: SortDir;
  onSort?: (sortKey: string) => void;
  /** desktop table only; use your own mobile card list */
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;

  /**
   * Optional style overrides (keeps component reusable across themes).
   * If your app is dark, defaults are dark-friendly.
   */
  className?: string;
  headerClassName?: string;
  headerCellHoverClassName?: string; // e.g. "hover:bg-white/5"
  bodyClassName?: string;
  rowHoverClassName?: string; // e.g. "hover:bg-white/5"
};

export default function DataTable<T>({
  rows,
  columns,
  activeSortKey,
  activeSortDir,
  onSort,
  rowKey,
  onRowClick,
  rowClassName,
  className,
  headerClassName,
  headerCellHoverClassName = "hover:bg-white/5",
  bodyClassName,
  rowHoverClassName = "hover:bg-white/5",
}: Props<T>) {
  return (
    <div
      className={[
        "overflow-auto rounded-xl border border-slate-700/80",
        "bg-slate-950/30 text-slate-100",
        className ?? "",
      ].join(" ")}
    >
      <table className="min-w-full text-sm">
        <thead
          className={[
            "bg-slate-900/70 text-slate-200",
            headerClassName ?? "",
          ].join(" ")}
        >
          <tr>
            {columns.map((c) => {
              const sortable = !!c.sortKey && !!onSort;
              const isActive = sortable && c.sortKey === activeSortKey;

              return (
                <th
                  key={c.id}
                  className={[
                    "text-left px-3 py-2 font-medium whitespace-nowrap",
                    sortable ? `select-none cursor-pointer ${headerCellHoverClassName}` : "",
                    c.thClassName ?? "",
                  ].join(" ")}
                  onClick={() => {
                    if (sortable && c.sortKey) onSort(c.sortKey);
                  }}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>{c.label}</span>
                    {isActive && (
                      <span className="text-[10px] text-slate-400">
                        {activeSortDir === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody
          className={[
            "divide-y divide-slate-800/80",
            bodyClassName ?? "",
          ].join(" ")}
        >
          {rows.map((r) => (
            <tr
              key={rowKey(r)}
              className={[
                onRowClick ? `cursor-pointer ${rowHoverClassName}` : "",
                rowClassName ? rowClassName(r) : "",
              ].join(" ")}
              onClick={() => onRowClick?.(r)}
            >
              {columns.map((c) => (
                <td key={c.id} className={["px-3 py-1 align-middle", c.tdClassName ?? ""].join(" ")}>
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
