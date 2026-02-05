import { useMemo } from "react";
import SlideOver from "../../common/components/SlideOver";
import type { Tenant } from "../../../lib/tenants";
import { inputClass } from "../../common/features/commonUI";
import PrefectureSelect from "../../common/components/PrefectureSelect";
import type { NavProps, EditProps, ErrorsProps } from "../../common/components/SlideOver";
import { FieldError } from "../../common/components/SlideOver";

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
  selected: Tenant | null;
  nav: NavProps;
  edit: EditProps;
  errors: ErrorsProps;
  form: {
    editState: EditState;
    setEdit: React.Dispatch<React.SetStateAction<EditState>>;
  };
};

export default function DetailSlideOver(props: Props) {
  const {
    open,
    onClose,
    selected,
    nav,
    edit,
    errors,
    form,
  } = props;

  const { editState, setEdit } = form;
  const title = useMemo(() => (edit.isEditing ? "データ編集" : "詳細データ"), [edit.isEditing]);

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      selected={selected}
      title={title}
      nav={ nav }
      edit={ edit }
      errors={ errors }
      isDeleted={(t: Tenant) => t.is_deleted}
    >
      {selected ? (
        edit.isEditing ? (
          <div className="space-y-3">
            {/* 基本情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">
                基本情報
              </div>
              <div>
                <label className="ui-label">テナント名称</label>
                <input
                  className={inputClass(!!errors.fieldErrors.tenant_name)}
                  value={editState.tenant_name}
                  onChange={(e) => setEdit((p) => ({ ...p, tenant_name: e.target.value }))}
                  disabled={edit.saving}
                />
                <FieldError messages={errors.fieldErrors.tenant_name} />
              </div>
              <div>
                <label className="ui-label">代表者</label>
                <input
                  className={inputClass(!!errors.fieldErrors.representative_name)}
                  value={editState.representative_name}
                  onChange={(e) => setEdit((p) => ({ ...p, representative_name: e.target.value }))}
                  disabled={edit.saving}
                />
                <FieldError messages={errors.fieldErrors.representative_name} />
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
                  className={inputClass(!!errors.fieldErrors.email)}
                  value={editState.email}
                  onChange={(e) => setEdit((p) => ({ ...p, email: e.target.value }))}
                  disabled={edit.saving}
                />
                <FieldError messages={errors.fieldErrors.email} />
              </div>
              <div>
                <label className="ui-label">電話</label>
                <input
                  className={inputClass(!!errors.fieldErrors.tel_number)}
                  value={editState.tel_number}
                  onChange={(e) => setEdit((p) => ({ ...p, tel_number: e.target.value }))}
                  disabled={edit.saving}
                />
                <FieldError messages={errors.fieldErrors.tel_number} />
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