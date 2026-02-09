import { useMemo } from "react";
import type { Product } from "../../../lib/products";
import { createActionColumn } from "../../common/components/ActionColumn";

export function ColumnsTable(opts: {
  openEdit: (p: Product) => void;
  onClickDelete: (id: number) => void;
  onClickRestore: (id: number) => void;
}) {
  const { openEdit, onClickDelete, onClickRestore } = opts;

  return useMemo(
    () => [
      {
        id: "product",
        label: "商品",
        sortKey: "product_name",
        render: (p: Product) => (
          <div className="min-w-0">
            <div className="font-medium text-slate-100 truncate">{p.product_name}</div>
          </div>
        ),
      },
      {
        id: "category",
        label: "カテゴリ",
        render: (p: Product) => p.product_category_name ?? "-",
      },
      {
        id: "unit_price",
        label: "単価",
        sortKey: "unit_price",
        render: (p: Product) => (
          <span className="tabular-nums">
            {p.unit_price ?? "-"}
          </span>
        ),
      },
      {
        id: "description",
        label: "備考",
        render: (p: Product) => (
          <div className="max-w-[360px] truncate text-sm text-slate-300" title={p.description ?? ""}>
            {p.description || "-"}
          </div>
        ),
      },

      // Action列（共通部品）
      createActionColumn<Product>({
        onEdit: (obj) => openEdit(obj),
        onDelete: (obj) => onClickDelete(obj.id),
        onRestore: (obj) => onClickRestore(obj.id),
      }),
    ],
    [openEdit, onClickDelete, onClickRestore]
  );
}