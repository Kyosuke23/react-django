import { useMemo } from "react";
import SlideOver from "../../common/components/SlideOver";
import type { Tenant } from "../../../lib/tenants";
import { inputClass } from "../../common/features/commonUI";
import PrefectureSelect from "../../common/components/PrefectureSelect";

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
      selected={selected}
      selectedIndex={selectedIndex}
      rowsLength={rowsLength}
      hasPrev={hasPrev}
      hasNext={hasNext}
      goPrev={goPrev}
      goNext={goNext}
      title={title}
      isEditing={isEditing}
      saving={saving}
      saveError={saveError}
      fieldErrors={fieldErrors}
      startEdit={startEdit}
      cancelEdit={cancelEdit}
      saveEdit={saveEdit}
      isDeleted={(p) => p.is_deleted}
    >
      {selected ? (
        isEditing ? (
          <div className="space-y-3">
            {/* 基本情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">
                基本情報
              </div>
              <div>
                <label className="ui-label">テナント名称</label>
                <input
                  className={inputClass(!!fieldErrors.tenant_name)}
                  value={edit.tenant_name}
                  onChange={(e) => setEdit((p) => ({ ...p, tenant_name: e.target.value }))}
                  disabled={saving}
                />
                <FieldError messages={fieldErrors.tenant_name} />
              </div>
              <div>
                <label className="ui-label">代表者</label>
                <input
                  className={inputClass(!!fieldErrors.representative_name)}
                  value={edit.representative_name}
                  onChange={(e) => setEdit((p) => ({ ...p, representative_name: e.target.value }))}
                  disabled={saving}
                />
                <FieldError messages={fieldErrors.representative_name} />
              </div>
            </div>

            {/* 連絡先情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">
                連絡先情報
              </div>
              <div>
                <label className="ui-label">Email</label>
                <input
                  className={inputClass(!!fieldErrors.email)}
                  value={edit.email}
                  onChange={(e) => setEdit((p) => ({ ...p, email: e.target.value }))}
                  disabled={saving}
                />
                <FieldError messages={fieldErrors.email} />
              </div>
              <div>
                <label className="ui-label">電話</label>
                <input
                  className={inputClass(!!fieldErrors.tel_number)}
                  value={edit.tel_number}
                  onChange={(e) => setEdit((p) => ({ ...p, tel_number: e.target.value }))}
                  disabled={saving}
                />
                <FieldError messages={fieldErrors.tel_number} />
              </div>
            </div>

            {/* 住所情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">
                住所情報
              </div>
              <div>
                <label className="ui-label">郵便番号</label>
                <input
                  className={inputClass(!!fieldErrors.postal_code)}
                  value={edit.postal_code}
                  onChange={(e) => setEdit((p) => ({ ...p, postal_code: e.target.value }))}
                  disabled={saving}
                />
                <FieldError messages={fieldErrors.postal_code} />
              </div>
              <PrefectureSelect
                label="都道府県"
                value={edit.state}
                onChange={(v) => setEdit((p) => ({ ...p, state: v }))}
                disabled={saving}
                error={!!fieldErrors.state}
                errorMessages={fieldErrors.state}
              />
              <div>
                <label className="ui-label">市区町村</label>
                <input
                  className={inputClass(!!fieldErrors.city)}
                  value={edit.city}
                  onChange={(e) => setEdit((p) => ({ ...p, city: e.target.value }))}
                  disabled={saving}
                />
                <FieldError messages={fieldErrors.city} />
              </div>
              <div>
                <label className="ui-label">住所</label>
                <input
                  className={inputClass(!!fieldErrors.address)}
                  value={edit.address}
                  onChange={(e) => setEdit((p) => ({ ...p, address: e.target.value }))}
                  disabled={saving}
                />
                <FieldError messages={fieldErrors.address} />
              </div>
              <div>
                <label className="ui-label">建物名等</label>
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
            {/* 基本情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">
                基本情報
              </div>
              <div className="ui-card">
                <dt className="ui-label">テナント名称</dt>
                <dd className="ui-value">{selected.tenant_name}</dd>
              </div>
            </div>

            {/* 連絡先情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">
                連絡先情報
              </div>
              <div className="ui-card">
                <dt className="ui-label">代表者</dt>
                <dd className="ui-value">{selected.representative_name}</dd>
              </div>
              <div className="ui-card">
                <dt className="ui-label">Email</dt>
                <dd className="ui-value">{selected.email}</dd>
              </div>
              <div className="ui-card">
                <dt className="ui-label">電話</dt>
                <dd className="ui-value">{selected.tel_number ?? "-"}</dd>
              </div>
            </div>

            {/* 住所情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">
                住所情報
              </div>
              <div className="ui-card">
                <dt className="ui-label">郵便番号</dt>
                <dd className="ui-value">{selected.postal_code ? `〒${selected.postal_code}` : null}</dd>
              </div>
              <div className="ui-card">
                <dt className="ui-label">住所</dt>
                <dd className="ui-value">
                  {[
                    selected.state,
                    selected.city,
                    selected.address,
                    selected.address2,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </dd>
              </div>
            </div>
          </dl>
        )
      ) : (
        <div className="ui-value">行を選択してください</div>
      )}
    </SlideOver>
  );
}