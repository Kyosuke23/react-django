import type { Dispatch, SetStateAction } from "react";
import type { Partner } from "../../../lib/partners";
import SlideOver from "../../common/components/SlideOver";

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

type Props = {
  open: boolean;
  onClose: () => void;

  selected: Partner | null;
  selectedIndex: number;
  rowsLength: number;

  hasPrev: boolean;
  hasNext: boolean;
  goPrev: () => void;
  goNext: () => void;

  isEditing: boolean;
  saving: boolean;

  edit: EditState;
  setEdit: Dispatch<SetStateAction<EditState>>;

  saveError: string | null;
  fieldErrors: Record<string, string[]>;

  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => void;
};

export default function PartnerDetailSlideOver(props: Props) {
  const {
    open,
    onClose,
    selected,
    selectedIndex,
    rowsLength,
    hasPrev,
    hasNext,
    goPrev,
    goNext,
    isEditing,
    saving,
    edit,
    setEdit,
    saveError,
    fieldErrors,
    startEdit,
    cancelEdit,
    saveEdit,
  } = props;

  return (
    <SlideOver open={open} onClose={onClose} title="取引先詳細">
      {!selected ? (
        <div className="p-4 text-sm text-slate-400">取引先が選択されていません</div>
      ) : (
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-slate-700 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold text-slate-100">
                  {selected.partner_name}
                </div>
                <div className="text-xs text-slate-400">
                  {selectedIndex + 1} / {rowsLength}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 disabled:opacity-40"
                  disabled={!hasPrev || isEditing}
                  onClick={goPrev}
                >
                  ← 前
                </button>
                <button
                  className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 disabled:opacity-40"
                  disabled={!hasNext || isEditing}
                  onClick={goNext}
                >
                  次 →
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* 基本情報 */}
            <Section title="基本情報">
              <Field label="取引先名" error={fieldErrors.partner_name}>
                <Input
                  value={edit.partner_name}
                  disabled={!isEditing}
                  onChange={(v) => setEdit((e) => ({ ...e, partner_name: v }))}
                />
              </Field>

              <Field label="取引先名（カナ）" error={fieldErrors.partner_name_kana}>
                <Input
                  value={edit.partner_name_kana}
                  disabled={!isEditing}
                  onChange={(v) => setEdit((e) => ({ ...e, partner_name_kana: v }))}
                />
              </Field>

              <Field label="区分" error={fieldErrors.partner_type}>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  disabled={!isEditing}
                  value={edit.partner_type}
                  onChange={(e) =>
                    setEdit((v) => ({ ...v, partner_type: e.target.value as Partner["partner_type"] }))
                  }
                >
                  <option value="customer">顧客</option>
                  <option value="supplier">仕入先</option>
                  <option value="both">顧客・仕入先</option>
                </select>
              </Field>
            </Section>

            {/* 連絡先 */}
            <Section title="連絡先">
              <Field label="担当者名" error={fieldErrors.contact_name}>
                <Input
                  value={edit.contact_name}
                  disabled={!isEditing}
                  onChange={(v) => setEdit((e) => ({ ...e, contact_name: v }))}
                />
              </Field>

              <Field label="Email" error={fieldErrors.email}>
                <Input
                  value={edit.email}
                  disabled={!isEditing}
                  onChange={(v) => setEdit((e) => ({ ...e, email: v }))}
                />
              </Field>

              <Field label="電話番号" error={fieldErrors.tel_number}>
                <Input
                  value={edit.tel_number}
                  disabled={!isEditing}
                  onChange={(v) => setEdit((e) => ({ ...e, tel_number: v }))}
                />
              </Field>
            </Section>

            {/* 住所 */}
            <Section title="住所">
              <Field label="郵便番号" error={fieldErrors.postal_code}>
                <Input
                  value={edit.postal_code}
                  disabled={!isEditing}
                  onChange={(v) => setEdit((e) => ({ ...e, postal_code: v }))}
                />
              </Field>

              <Field label="都道府県" error={fieldErrors.state}>
                <Input
                  value={edit.state}
                  disabled={!isEditing}
                  onChange={(v) => setEdit((e) => ({ ...e, state: v }))}
                />
              </Field>

              <Field label="市区町村" error={fieldErrors.city}>
                <Input
                  value={edit.city}
                  disabled={!isEditing}
                  onChange={(v) => setEdit((e) => ({ ...e, city: v }))}
                />
              </Field>

              <Field label="住所" error={fieldErrors.address}>
                <Input
                  value={edit.address}
                  disabled={!isEditing}
                  onChange={(v) => setEdit((e) => ({ ...e, address: v }))}
                />
              </Field>

              <Field label="建物名など" error={fieldErrors.address2}>
                <Input
                  value={edit.address2}
                  disabled={!isEditing}
                  onChange={(v) => setEdit((e) => ({ ...e, address2: v }))}
                />
              </Field>
            </Section>

            {saveError && (
              <div className="rounded-lg bg-rose-900/30 px-3 py-2 text-sm text-rose-200">
                {saveError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700 px-4 py-3 flex justify-end gap-2">
            {!isEditing ? (
              <button
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-40"
                disabled={selected.is_deleted}
                onClick={startEdit}
              >
                編集
              </button>
            ) : (
              <>
                <button
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  キャンセル
                </button>
                <button
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-40"
                  onClick={saveEdit}
                  disabled={saving}
                >
                  保存
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </SlideOver>
  );
}

/* ---------- helpers ---------- */

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-slate-200">{props.title}</div>
      <div className="grid grid-cols-1 gap-3">{props.children}</div>
    </div>
  );
}

function Field(props: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  const { label, error, children } = props;
  return (
    <div className="space-y-1">
      <label className="block text-xs text-slate-300">{label}</label>
      {children}
      {error && error.length > 0 && (
        <div className="text-xs text-rose-300">{error.join(" ")}</div>
      )}
    </div>
  );
}

function Input(props: {
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={props.value}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 disabled:opacity-60"
    />
  );
}