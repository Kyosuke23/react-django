import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import SlideOver from "../../common/components/SlideOver";
import type { Partner } from "../../../lib/partners";
import { inputClass } from "../../common/features/commonUI";
import PrefectureSelect from "../../common/components/PrefectureSelect";
import type { NavProps, EditProps, ErrorsProps } from "../../common/components/SlideOver";
import { FieldError } from "../../common/components/SlideOver";

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
  nav: NavProps;
  edit: EditProps;
  errors: ErrorsProps;
  form: {
    editState: EditState;
    setEdit: Dispatch<SetStateAction<EditState>>;
  };
};

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

export default function DetailSlideOver(props: Props) {
  const { open, onClose, selected, nav, edit, errors, form } = props;
  const { editState, setEdit } = form;

  // 新規登録モード：selected が null でも edit.isEditing=true の状態で開く想定
  const isCreate = selected == null && edit.isEditing;

  const title = useMemo(() => {
    if (isCreate) return "新規登録";
    return edit.isEditing ? "データ編集" : "詳細データ";
  }, [isCreate, edit.isEditing]);

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      selected={selected}
      title={title}
      nav={nav}
      edit={edit}
      errors={errors}
      isDeleted={(p: Partner) => p.is_deleted}
    >
      {selected || isCreate ? (
        edit.isEditing ? (
          <div className="space-y-3">
            {/* 基本情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">基本情報</div>

              <div>
                <label className="ui-label">取引先名称</label>
                <input
                  className={inputClass(!!errors.fieldErrors.partner_name)}
                  value={editState.partner_name}
                  onChange={(e) => setEdit((p) => ({ ...p, partner_name: e.target.value }))}
                  disabled={edit.saving}
                />
                <FieldError messages={errors.fieldErrors.partner_name} />
              </div>

              <div>
                <label className="ui-label">取引先名称（カナ）</label>
                <input
                  className={inputClass(!!errors.fieldErrors.partner_name_kana)}
                  value={editState.partner_name_kana}
                  onChange={(e) => setEdit((p) => ({ ...p, partner_name_kana: e.target.value }))}
                  disabled={edit.saving}
                />
                <FieldError messages={errors.fieldErrors.partner_name_kana} />
              </div>

              <div>
                <label className="ui-label">取引先区分</label>
                <select
                  className={inputClass(!!errors.fieldErrors.partner_type)}
                  value={editState.partner_type}
                  onChange={(e) =>
                    setEdit((p) => ({
                      ...p,
                      partner_type: e.target.value as Partner["partner_type"],
                    }))
                  }
                  disabled={edit.saving}
                >
                  <option value="customer">顧客</option>
                  <option value="supplier">仕入先</option>
                  <option value="both">顧客・仕入先</option>
                </select>
                <FieldError messages={errors.fieldErrors.partner_type} />
              </div>
            </div>

            {/* 連絡先情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">連絡先情報</div>

              <div>
                <label className="ui-label">担当者名</label>
                <input
                  className={inputClass(!!errors.fieldErrors.contact_name)}
                  value={editState.contact_name}
                  onChange={(e) => setEdit((p) => ({ ...p, contact_name: e.target.value }))}
                  disabled={edit.saving}
                />
                <FieldError messages={errors.fieldErrors.contact_name} />
              </div>

              <div>
                <label className="ui-label">電話番号</label>
                <input
                  className={inputClass(!!errors.fieldErrors.tel_number)}
                  value={editState.tel_number}
                  onChange={(e) => setEdit((p) => ({ ...p, tel_number: e.target.value }))}
                  disabled={edit.saving}
                  placeholder="例）03-1234-5678"
                />
                <FieldError messages={errors.fieldErrors.tel_number} />
              </div>

              <div>
                <label className="ui-label">E-Mail</label>
                <input
                  className={inputClass(!!errors.fieldErrors.email)}
                  value={editState.email}
                  onChange={(e) => setEdit((p) => ({ ...p, email: e.target.value }))}
                  disabled={edit.saving}
                  placeholder="example@example.com"
                />
                <FieldError messages={errors.fieldErrors.email} />
              </div>
            </div>

            {/* 住所情報 */}
            <div className="ui-card ui-card-stack">
              <div>
                <label className="ui-label">郵便番号</label>
                <input
                  className={inputClass(!!errors.fieldErrors.postal_code)}
                  value={editState.postal_code}
                  onChange={(e) => setEdit((p) => ({ ...p, postal_code: e.target.value }))}
                  disabled={edit.saving}
                />
                <FieldError messages={errors.fieldErrors.postal_code} />
              </div>

              <PrefectureSelect
                label="都道府県"
                value={editState.state}
                onChange={(v) => setEdit((p) => ({ ...p, state: v }))}
                disabled={edit.saving}
                error={!!errors.fieldErrors.state}
                errorMessages={errors.fieldErrors.state}
              />

              <div>
                <label className="ui-label">市区町村</label>
                <input
                  className={inputClass(!!errors.fieldErrors.city)}
                  value={editState.city}
                  onChange={(e) => setEdit((p) => ({ ...p, city: e.target.value }))}
                  disabled={edit.saving}
                />
                <FieldError messages={errors.fieldErrors.city} />
              </div>

              <div>
                <label className="ui-label">住所</label>
                <input
                  className={inputClass(!!errors.fieldErrors.address)}
                  value={editState.address}
                  onChange={(e) => setEdit((p) => ({ ...p, address: e.target.value }))}
                  disabled={edit.saving}
                />
                <FieldError messages={errors.fieldErrors.address} />
              </div>

              <div>
                <label className="ui-label">建物名等</label>
                <input
                  className={inputClass(!!errors.fieldErrors.address2)}
                  value={editState.address2}
                  onChange={(e) => setEdit((p) => ({ ...p, address2: e.target.value }))}
                  disabled={edit.saving}
                />
                <FieldError messages={errors.fieldErrors.address2} />
              </div>
            </div>
          </div>
        ) : selected ? (
          <dl className="space-y-3">
            {/* 基本情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">基本情報</div>

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
                <dd className="ui-value">{partnerTypeLabel(selected.partner_type)}</dd>
              </div>
            </div>

            {/* 連絡先情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">連絡先情報</div>

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
              <div className="ui-subtitle">住所情報</div>

              <div className="ui-card">
                <dt className="ui-label">郵便番号</dt>
                <dd className="ui-value">{selected.postal_code ? `〒${selected.postal_code}` : null}</dd>
              </div>

              <div className="ui-card">
                <dt className="ui-label">住所</dt>
                <dd className="ui-value">
                  {[selected.state, selected.city, selected.address, selected.address2]
                    .filter(Boolean)
                    .join(" ")}
                </dd>
              </div>
            </div>
          </dl>
        ) : (
          <div className="ui-value">新規登録を開始してください</div>
        )
      ) : (
        <div className="ui-value">行を選択してください</div>
      )}
    </SlideOver>
  );
}
