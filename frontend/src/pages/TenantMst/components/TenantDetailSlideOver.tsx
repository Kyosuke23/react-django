import { useMemo } from "react";
import SlideOver from "../../common/components/SlideOver";
import type { Tenant } from "../../../lib/tenants";

export type EditState = {
  tenant_name: string;
  representative_name: string;
  email: string;
  tel_number: string;
  postal_code: string;
  state: string;
  city: string;
  address: string;
  address2: string;
};

type Props = {
  open: boolean;
  onClose: () => void;

  // 選択中
  selected: Tenant | null;

  // ナビゲーション（今ページ内）
  selectedIndex: number; // -1 のとき未選択
  rowsLength: number;
  hasPrev: boolean;
  hasNext: boolean;
  goPrev: () => void;
  goNext: () => void;

  // 編集状態
  isEditing: boolean;
  saving: boolean;
  edit: EditState;
  setEdit: React.Dispatch<React.SetStateAction<EditState>>;

  // エラー
  saveError: string | null;
  fieldErrors: Record<string, string[]>;

  // 操作
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => void;

  // 閉じる時に TenantList 側で持ってる state も初期化したいので、
  // TenantList の onClose に処理を寄せるのが安全
};

function inputClass(hasError: boolean) {
  return [
    "w-full rounded-lg px-3 py-2 text-sm",
    "bg-slate-950/30 text-slate-100",
    "border outline-none",
    hasError
      ? "border-rose-500 focus:ring-2 focus:ring-rose-500/40"
      : "border-slate-700 focus:ring-2 focus:ring-white/10",
  ].join(" ");
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-rose-400">{messages.join(", ")}</p>;
}

export default function TenantDetailSlideOver(props: Props) {
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

  const title = useMemo(() => (isEditing ? "データ編集" : "詳細データ"), [isEditing]);

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={title}
      headerRight={
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm bg-slate-200 text-slate-900 hover:bg-white disabled:opacity-40"
              onClick={startEdit}
              disabled={!selected || !!selected?.is_deleted}
              title={selected?.is_deleted ? "削除済みは編集できません" : "編集"}
            >
              編集
            </button>
          ) : (
            <>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm border border-slate-700 text-slate-200 hover:bg-slate-900/40 disabled:opacity-40"
                onClick={cancelEdit}
                disabled={saving}
              >
                キャンセル
              </button>

              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="p-4 space-y-3">
        {/* 前へ / 次へ */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm border border-slate-700 text-slate-200 disabled:opacity-40"
            onClick={goPrev}
            disabled={!hasPrev || isEditing}
            title={isEditing ? "編集中は移動できません" : "前の明細"}
          >
            ← 前の明細
          </button>

          <div className="text-xs text-slate-400">
            {selectedIndex >= 0 ? `${selectedIndex + 1} / ${rowsLength}` : ""}
          </div>

          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm border border-slate-700 text-slate-200 disabled:opacity-40"
            onClick={goNext}
            disabled={!hasNext || isEditing}
            title={isEditing ? "編集中は移動できません" : "次の明細"}
          >
            次の明細 →
          </button>
        </div>

        {/* non_field_errors を優先表示 */}
        {fieldErrors.non_field_errors?.length ? (
          <pre className="whitespace-pre-wrap rounded-lg border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
            {fieldErrors.non_field_errors.join("\n")}
          </pre>
        ) : saveError ? (
          <pre className="whitespace-pre-wrap rounded-lg border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
            {saveError}
          </pre>
        ) : null}

        {selected ? (
          isEditing ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <label className="block text-xs text-slate-400 mb-1">テナント名称</label>
                <input
                  className={inputClass(!!fieldErrors.tenant_name)}
                  value={edit.tenant_name}
                  onChange={(e) => setEdit((p) => ({ ...p, tenant_name: e.target.value }))}
                  disabled={saving}
                />
                <FieldError messages={fieldErrors.tenant_name} />
              </div>

              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <label className="block text-xs text-slate-400 mb-1">代表者</label>
                <input
                  className={inputClass(!!fieldErrors.representative_name)}
                  value={edit.representative_name}
                  onChange={(e) => setEdit((p) => ({ ...p, representative_name: e.target.value }))}
                  disabled={saving}
                />
                <FieldError messages={fieldErrors.representative_name} />
              </div>

              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  className={inputClass(!!fieldErrors.email)}
                  value={edit.email}
                  onChange={(e) => setEdit((p) => ({ ...p, email: e.target.value }))}
                  disabled={saving}
                />
                <FieldError messages={fieldErrors.email} />
              </div>

              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <label className="block text-xs text-slate-400 mb-1">電話</label>
                <input
                  className={inputClass(!!fieldErrors.tel_number)}
                  value={edit.tel_number}
                  onChange={(e) => setEdit((p) => ({ ...p, tel_number: e.target.value }))}
                  disabled={saving}
                />
                <FieldError messages={fieldErrors.tel_number} />
              </div>

              <div className="rounded-lg bg-slate-900/60 px-4 py-3 space-y-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">郵便番号</label>
                  <input
                    className={inputClass(!!fieldErrors.postal_code)}
                    value={edit.postal_code}
                    onChange={(e) => setEdit((p) => ({ ...p, postal_code: e.target.value }))}
                    disabled={saving}
                  />
                  <FieldError messages={fieldErrors.postal_code} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">都道府県</label>
                    <input
                      className={inputClass(!!fieldErrors.state)}
                      value={edit.state}
                      onChange={(e) => setEdit((p) => ({ ...p, state: e.target.value }))}
                      disabled={saving}
                    />
                    <FieldError messages={fieldErrors.state} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">市区町村</label>
                    <input
                      className={inputClass(!!fieldErrors.city)}
                      value={edit.city}
                      onChange={(e) => setEdit((p) => ({ ...p, city: e.target.value }))}
                      disabled={saving}
                    />
                    <FieldError messages={fieldErrors.city} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">住所</label>
                  <input
                    className={inputClass(!!fieldErrors.address)}
                    value={edit.address}
                    onChange={(e) => setEdit((p) => ({ ...p, address: e.target.value }))}
                    disabled={saving}
                  />
                  <FieldError messages={fieldErrors.address} />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">建物名等</label>
                  <input
                    className={inputClass(!!fieldErrors.address2)}
                    value={edit.address2}
                    onChange={(e) => setEdit((p) => ({ ...p, address2: e.target.value }))}
                    disabled={saving}
                  />
                  <FieldError messages={fieldErrors.address2} />
                </div>
              </div>
            </div>
          ) : (
            <dl className="space-y-3">
              <div className="rounded-lg bg-slate-900/60 px-4 py-3">
                <dt className="text-xs text-slate-400 mb-1">テナント名称</dt>
                <dd className="text-sm font-medium break-all">{selected.tenant_name}</dd>
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
          )
        ) : (
          <div className="text-sm text-slate-500">行を選択してください</div>
        )}
      </div>
    </SlideOver>
  );
}