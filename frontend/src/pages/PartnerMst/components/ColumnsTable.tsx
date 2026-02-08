import { useMemo } from "react";
import type { Partner } from "../../../lib/partners";
import { createActionColumn } from "../../common/components/ActionColumn";

function partnerTypeLabel(v: Partner["partner_type"]) {
  switch (v) {
    case "customer":
      return "顧客";
    case "supplier":
      return "仕入先";
    case "both":
      return "顧客・仕入先";
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
              <div className="text-xs text-slate-400/80 truncate">{p.partner_name_kana}</div>
            ) : null}
          </div>
        ),
      },
      {
        id: "type",
        label: "取引先区分",
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
        id: "contact_name",
        label: "担当者名",
        sortKey: "contact_name",
        render: (p: Partner) => p.contact_name ?? "-",
      },
      {
        id: "address",
        label: "住所",
        render: (p: Partner) => {
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
            <div className="max-w-[360px] truncate text-sm text-slate-300" title={address}>
              {address || "-"}
            </div>
          );
        },
      },

      // Action列（共通部品）
      createActionColumn<Partner>({
        onEdit: (obj) => openEdit(obj),
        onDelete: (obj) => onClickDelete(obj.id),
        onRestore: (obj) => onClickRestore(obj.id),
      }),
    ],
    [openEdit, onClickDelete, onClickRestore]
  );
}