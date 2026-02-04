import { useMemo } from "react";
import type { Partner } from "../../../lib/partners";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

function partnerTypeLabel(v: Partner["partner_type"]) {
  switch (v) {
    case "customer":
      return "顧客";
    case "supplier":
      return "仕入先";
    case "both":
      return "両方";
    default:
      return v;
  }
}

export function ColumnsTable(opts: {
  openEdit: (p: Partner) => void;
  onClickDelete: (id: number) => void;
  onClickRestore: (id: number) => void;
}) {
  const { openEdit, onClickDelete, onClickRestore } = opts;

  return useMemo(
    () => [
      {
        id: "partner",
        label: "取引先",
        sortKey: "partner_name",
        render: (p: Partner) => (
          <div className="min-w-0">
            <div className="font-medium text-slate-100 truncate">{p.partner_name}</div>
            {p.partner_name_kana ? (
              <div className="text-xs text-slate-300 truncate">{p.partner_name_kana}</div>
            ) : null}
          </div>
        ),
      },
      {
        id: "type",
        label: "区分",
        sortKey: "partner_type",
        render: (p: Partner) => partnerTypeLabel(p.partner_type),
      },
      {
        id: "email",
        label: "Email",
        sortKey: "email",
        render: (p: Partner) => <span className="break-all">{p.email}</span>,
      },
      {
        id: "tel",
        label: "電話",
        sortKey: "tel_number",
        render: (p: Partner) => p.tel_number ?? "-",
      },
      {
        id: "actions",
        label: "",
        render: (p: Partner) => (
          <div className="flex items-center justify-end gap-2">
            <button
              className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-40"
              title="編集"
              disabled={p.is_deleted}
              onClick={(e) => {
                e.stopPropagation();
                openEdit(p);
              }}
            >
              <PencilSquareIcon className="h-5 w-5 text-slate-600" />
            </button>

            {!p.is_deleted ? (
              <button
                className="rounded-lg p-2 hover:bg-slate-100"
                title="削除"
                onClick={(e) => {
                  e.stopPropagation();
                  onClickDelete(p.id);
                }}
              >
                <TrashIcon className="h-5 w-5 text-rose-600" />
              </button>
            ) : (
              <button
                className="rounded-lg px-3 py-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onClickRestore(p.id);
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
}