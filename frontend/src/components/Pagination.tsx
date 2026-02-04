import type { ReactNode } from "react";

type Props = {
  page: number;        // 1-based
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  className?: string;
  rightSlot?: ReactNode; // e.g. "total xx件"
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildPages(page: number, totalPages: number) {
  // Show: 1 ... (p-1) p (p+1) ... total
  const pages: (number | "…")[] = [];
  const add = (v: number | "…") => pages.push(v);

  const showAll = totalPages <= 7;
  if (showAll) {
    for (let i = 1; i <= totalPages; i++) add(i);
    return pages;
  }

  add(1);
  if (page > 3) add("…");

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) add(i);

  if (page < totalPages - 2) add("…");
  add(totalPages);
  return pages;
}

export default function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  className,
  rightSlot,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = clamp(page, 1, totalPages);
  const start = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = totalCount === 0 ? 0 : Math.min(totalCount, safePage * pageSize);

  const pages = buildPages(safePage, totalPages);

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  return (
    <div
      className={[
        "grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-2",
        className ?? "",
      ].join(" ")}
    >
      <div className="text-xs text-slate-300 justify-self-start">
        {totalCount.toLocaleString()}件中 / {start.toLocaleString()}件〜{end.toLocaleString()}件を表示
      </div>

      <div className="flex items-center gap-1 justify-self-center">
        <button
          className={[
            "rounded-md px-2 py-1 text-sm",
            canPrev ? "hover:bg-white/10" : "opacity-40 cursor-not-allowed",
          ].join(" ")}
          onClick={() => canPrev && onPageChange(1)}
          disabled={!canPrev}
          aria-label="最初のページ"
          title="最初のページ"
        >
          «
        </button>

        <button
          className={[
            "rounded-md px-2 py-1 text-sm",
            canPrev ? "hover:bg-white/10" : "opacity-40 cursor-not-allowed",
          ].join(" ")}
          onClick={() => canPrev && onPageChange(safePage - 1)}
          disabled={!canPrev}
        >
          ←
        </button>

        {pages.map((p, idx) =>
          p === "…" ? (
            <span key={`e-${idx}`} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              className={[
                "rounded-md px-2 py-1 text-sm",
                p == safePage ? "bg-white/15" : "hover:bg-white/10",
              ].join(" ")}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className={[
            "rounded-md px-2 py-1 text-sm",
            canNext ? "hover:bg-white/10" : "opacity-40 cursor-not-allowed",
          ].join(" ")}
          onClick={() => canNext && onPageChange(safePage + 1)}
          disabled={!canNext}
        >
          →
        </button>

        <button
          className={[
            "rounded-md px-2 py-1 text-sm",
            canNext ? "hover:bg-white/10" : "opacity-40 cursor-not-allowed",
          ].join(" ")}
          onClick={() => canNext && onPageChange(totalPages)}
          disabled={!canNext}
          aria-label="最後のページ"
          title="最後のページ"
        >
          »
        </button>
      </div>

      <div className="hidden sm:block justify-self-end">{rightSlot}</div>
    </div>
  );
}
