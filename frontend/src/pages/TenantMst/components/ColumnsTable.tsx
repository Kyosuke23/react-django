import { useMemo } from "react";
import type { Tenant } from "../../../lib/tenants";
import { createActionColumn } from "../../common/components/ActionColumn";

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
      // Action列（共通部品）
      createActionColumn<Tenant>({
        onEdit: (obj) => openEdit(obj),
        onDelete: (obj) => onClickDelete(obj.id),
        onRestore: (obj) => onClickRestore(obj.id),
      }),
    ],
    [openEdit, onClickDelete, onClickRestore]
  );
}