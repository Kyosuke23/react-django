import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import SlideOver from "../../common/components/SlideOver";
import type { Product } from "../../../lib/products";
import type { CategoryChoice } from "../../../lib/productCategories";
import { inputClass } from "../../common/features/commonUI";
import type {
  NavProps,
  EditProps,
  ErrorsProps,
} from "../../common/components/SlideOver";
import { FieldError } from "../../common/components/SlideOver";

type EditState = {
  product_code: string;
  product_name: string;
  product_name_kana: string;
  product_category: number | ""; // 未選択は ""
  unit_price: string;
  tax_rate: string;
  remarks: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  selected: Product | null;
  nav: NavProps;
  edit: EditProps;
  errors: ErrorsProps;
  form: {
    editState: EditState;
    setEdit: Dispatch<SetStateAction<EditState>>;
  };
  categoryChoices: CategoryChoice[];
};

export default function DetailSlideOver(props: Props) {
  const { open, onClose, selected, nav, edit, errors, form, categoryChoices } =
    props;
  const { editState, setEdit } = form;

  // 新規登録モード：selected が null でも edit.isEditing=true の状態で開く想定（Partnerと同じ）
  const isCreate = selected == null && edit.isEditing;

  const title = useMemo(() => {
    if (isCreate) return "新規登録";
    return edit.isEditing ? "データ編集" : "詳細データ";
  }, [isCreate, edit.isEditing]);

  // 表示用：カテゴリ名
  const selectedCategoryName = (() => {
    if (selected?.product_category_name) return selected.product_category_name;

    const id = editState.product_category;
    if (id === "") return null;

    return (
      categoryChoices.find((c) => c.id === id)?.product_category_name ?? null
    );
  })();

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      selected={selected}
      title={title}
      nav={nav}
      edit={edit}
      errors={errors}
      isDeleted={(p: Product) => p.is_deleted}
    >
      {selected || isCreate ? (
        edit.isEditing ? (
          <div className="space-y-3">
            {/* 基本情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">基本情報</div>

              <div>
                <label className="ui-label">商品コード</label>
                <input
                  className={inputClass(!!errors.fieldErrors.product_code)}
                  value={editState.product_code}
                  onChange={(e) =>
                    setEdit((p) => ({ ...p, product_code: e.target.value }))
                  }
                  disabled={edit.saving}
                  placeholder="例）P-001"
                />
                <FieldError messages={errors.fieldErrors.product_code} />
              </div>

              <div>
                <label className="ui-label">商品名</label>
                <input
                  className={inputClass(!!errors.fieldErrors.product_name)}
                  value={editState.product_name}
                  onChange={(e) =>
                    setEdit((p) => ({ ...p, product_name: e.target.value }))
                  }
                  disabled={edit.saving}
                  placeholder="例）りんご"
                />
                <FieldError messages={errors.fieldErrors.product_name} />
              </div>

              <div>
                <label className="ui-label">商品名（カナ）</label>
                <input
                  className={inputClass(!!errors.fieldErrors.product_name_kana)}
                  value={editState.product_name_kana}
                  onChange={(e) =>
                    setEdit((p) => ({
                      ...p,
                      product_name_kana: e.target.value,
                    }))
                  }
                  disabled={edit.saving}
                  placeholder="例）リンゴ"
                />
                <FieldError messages={errors.fieldErrors.product_name_kana} />
              </div>

              <div>
                <label className="ui-label">商品カテゴリ</label>
                <select
                  className={inputClass(!!errors.fieldErrors.product_category)}
                  value={editState.product_category}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEdit((p) => ({
                      ...p,
                      product_category: v === "" ? "" : Number(v),
                    }));
                  }}
                  disabled={edit.saving}
                >
                  <option value="">未選択</option>
                  {categoryChoices.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.product_category_name}
                    </option>
                  ))}
                </select>
                <FieldError messages={errors.fieldErrors.product_category} />
              </div>
            </div>

            {/* 価格情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">価格情報</div>

              <div>
                <label className="ui-label">単価</label>
                <input
                  className={inputClass(!!errors.fieldErrors.unit_price)}
                  value={editState.unit_price}
                  onChange={(e) =>
                    setEdit((p) => ({ ...p, unit_price: e.target.value }))
                  }
                  disabled={edit.saving}
                  inputMode="numeric"
                  placeholder="例）1000"
                />
                <FieldError messages={errors.fieldErrors.unit_price} />
              </div>

              <div>
                <label className="ui-label">税率</label>
                <input
                  className={inputClass(!!errors.fieldErrors.tax_rate)}
                  value={editState.tax_rate}
                  onChange={(e) =>
                    setEdit((p) => ({ ...p, tax_rate: e.target.value }))
                  }
                  disabled={edit.saving}
                  inputMode="decimal"
                  placeholder="例）10"
                />
                <FieldError messages={errors.fieldErrors.tax_rate} />
              </div>
            </div>

            {/* 備考 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">備考</div>

              <div>
                <label className="ui-label">備考</label>
                <textarea
                  className={inputClass(!!errors.fieldErrors.remarks)}
                  value={editState.remarks}
                  onChange={(e) =>
                    setEdit((p) => ({ ...p, remarks: e.target.value }))
                  }
                  disabled={edit.saving}
                  rows={4}
                  placeholder="任意"
                />
                <FieldError messages={errors.fieldErrors.remarks} />
              </div>
            </div>
          </div>
        ) : selected ? (
          <dl className="space-y-3">
            {/* 基本情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">基本情報</div>

              <div className="ui-card">
                <dt className="ui-label">商品コード</dt>
                <dd className="ui-value">{selected.product_code}</dd>
              </div>

              <div className="ui-card">
                <dt className="ui-label">商品名</dt>
                <dd className="ui-value">{selected.product_name}</dd>
              </div>

              <div className="ui-card">
                <dt className="ui-label">商品名（カナ）</dt>
                <dd className="ui-value">
                  {selected.product_name_kana || "-"}
                </dd>
              </div>

              <div className="ui-card">
                <dt className="ui-label">カテゴリ</dt>
                <dd className="ui-value">{selectedCategoryName || "-"}</dd>
              </div>
            </div>

            {/* 価格情報 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">価格情報</div>

              <div className="ui-card">
                <dt className="ui-label">単価</dt>
                <dd className="ui-value">{selected.unit_price ?? "-"}</dd>
              </div>

              <div className="ui-card">
                <dt className="ui-label">税率</dt>
                <dd className="ui-value">{selected.tax_rate ?? "-"}</dd>
              </div>
            </div>

            {/* 備考 */}
            <div className="ui-card ui-card-stack">
              <div className="ui-subtitle">備考</div>

              <div className="ui-card">
                <dt className="ui-label">備考</dt>
                <dd className="ui-value whitespace-pre-wrap">
                  {selected.remarks || "-"}
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
