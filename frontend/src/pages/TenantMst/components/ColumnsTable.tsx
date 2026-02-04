import { useMemo } from "react";
import type { Tenant } from "../../../lib/tenants";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export function ColumnsTable(opts: {
  openEdit: (t: Tenant) => void;
  onClickDelete: (id: number) => void;
  onClickRestore: (id: number) => void;
}) {
  const { openEdit, onClickDelete, onClickRestore } = opts;

  return useMemo(
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
}