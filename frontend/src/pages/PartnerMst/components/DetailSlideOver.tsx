import { useMemo } from "react";
import SlideOver from "../../common/components/SlideOver";
import type { Partner } from "../../../lib/partners";
import { inputClass } from "../../common/features/commonUI";
import PrefectureSelect from "../../common/components/PrefectureSelect";

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
  setEdit: React.Dispatch<React.SetStateAction<EditState>>;

  saveError: string | null;
  fieldErrors: Record<string, string[]>;

  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => void;
};


function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-rose-400">{messages.join(", ")}</p>;
}

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
              className="ui-btn-edit"
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
                className="ui-btn-cancel"
                onClick={cancelEdit}
                disabled={saving}
              >
                キャンセル
              </button>

              <button
                type="button"
                className="ui-btn-save"
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
            className="ui-btn-nav"
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
            className="ui-btn-nav"
            onClick={goNext}
            disabled={!hasNext || isEditing}
            title={isEditing ? "編集中は移動できません" : "次の明細"}
          >
            次の明細 →
          </button>
        </div>

        {fieldErrors.non_field_errors?.length ? (
          <pre className="ui-error-message">
            {fieldErrors.non_field_errors.join("\n")}
          </pre>
        ) : saveError ? (
          <pre className="ui-error-message">
            {saveError}
          </pre>
        ) : null}

        {selected ? (
          isEditing ? (
            <div className="space-y-3">
              {/* 基本情報 */}
              <div className="ui-card ui-card-stack">
                <div className="ui-subtitle">
                  基本情報
                </div>
                <div>
                  <label className="ui-label">取引先名称</label>
                  <input
                    className={inputClass(!!fieldErrors.partner_name)}
                    value={edit.partner_name}
                    onChange={(e) => setEdit((p) => ({ ...p, partner_name: e.target.value }))}
                    disabled={saving}
                  />
                  <FieldError messages={fieldErrors.partner_name} />
                </div>
                <div>
                  <label className="ui-label">取引先名称（カナ）</label>
                  <input
                    className={inputClass(!!fieldErrors.partner_name_kana)}
                    value={edit.partner_name_kana}
                    onChange={(e) => setEdit((p) => ({ ...p, partner_name_kana: e.target.value }))}
                    disabled={saving}
                  />
                  <FieldError messages={fieldErrors.partner_name_kana} />
                </div>
                <div>
                  <label className="ui-label">区分</label>
                  <select
                    className={inputClass(!!fieldErrors.partner_type)}
                    value={edit.partner_type}
                    onChange={(e) =>
                      setEdit((p) => ({
                        ...p,
                        partner_type: e.target.value as Partner["partner_type"],
                      }))
                    }
                    disabled={saving}
                  >
                    <option value="customer">顧客</option>
                    <option value="supplier">仕入先</option>
                    <option value="both">顧客・仕入先</option>
                  </select>
                  <FieldError messages={fieldErrors.partner_type} />
                </div>
              </div>

              {/* 連絡先情報 */}
              <div className="ui-card ui-card-stack">
                <div className="ui-subtitle">
                  連絡先情報
                </div>
                <div>
                  <label className="ui-label">担当者名</label>
                  <input
                    className={inputClass(!!fieldErrors.contact_name)}
                    value={edit.contact_name}
                    onChange={(e) => setEdit((p) => ({ ...p, contact_name: e.target.value }))}
                    disabled={saving}
                  />
                  <FieldError messages={fieldErrors.contact_name} />
                </div>

                <div>
                  <label className="ui-label">電話番号</label>
                  <input
                    className={inputClass(!!fieldErrors.tel_number)}
                    value={edit.tel_number}
                    onChange={(e) => setEdit((p) => ({ ...p, tel_number: e.target.value }))}
                    disabled={saving}
                    placeholder="例）03-1234-5678"
                  />
                  <FieldError messages={fieldErrors.tel_number} />
                </div>

                <div>
                  <label className="ui-label">E-Mail</label>
                  <input
                    className={inputClass(!!fieldErrors.email)}
                    value={edit.email}
                    onChange={(e) => setEdit((p) => ({ ...p, email: e.target.value }))}
                    disabled={saving}
                    placeholder="example@example.com"
                  />
                  <FieldError messages={fieldErrors.email} />
                </div>
              </div>

              {/* 住所情報 */}
              <div className="ui-card ui-card-stack">
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
                  <dt className="ui-label">取引先名称</dt>
                  <dd className="ui-value">{selected.partner_name}</dd>
                </div>

                <div className="ui-card">
                  <dt className="ui-label">取引先名称（カナ）</dt>
                  <dd className="ui-value">{selected.partner_name_kana}</dd>
                </div>

                <div className="ui-card">
                  <dt className="ui-label">区分</dt>
                  <dd className="ui-value">
                    {partnerTypeLabel(selected.partner_type)}
                  </dd>
                </div>
              </div>

              {/* 連絡先情報 */}
              <div className="ui-card ui-card-stack">
                <div className="ui-subtitle">
                  連絡先情報
                </div>
                <div className="ui-card">
                  <dt className="ui-label">担当者名</dt>
                  <dd className="ui-value">{selected.contact_name}</dd>
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
      </div>
    </SlideOver>
  );
}
