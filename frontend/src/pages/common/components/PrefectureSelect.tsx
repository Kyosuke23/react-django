import { useMemo } from "react";
import { inputClass } from "../features/commonUI";

export type PrefectureValue = "" | null | string;

const PREFECTURES = [
  "北海道",
  "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県",
  "沖縄県",
] as const;

type Props = {
  /** ラベル表示（例: 都道府県 / 住所（都道府県）など） */
  label?: string;
  /** 現在値（"" or null を許容） */
  value: PrefectureValue;
  /** 値変更（空選択時は null にしたいなら normalizeNull を使う） */
  onChange: (value: string) => void;

  /** サーババリデーション表示用 */
  error?: boolean;
  errorMessages?: string[];

  /** disabled */
  disabled?: boolean;

  /** 「未選択」を表示するか（既定 true） */
  allowEmpty?: boolean;
  emptyLabel?: string;

  /** 空文字を null に寄せたいとき（既定 false） */
  normalizeNull?: boolean;

  /** 任意 class */
  className?: string;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-rose-400">{messages.join(", ")}</p>;
}

export default function PrefectureSelect({
  label = "都道府県",
  value,
  onChange,
  error,
  errorMessages,
  disabled,
  allowEmpty = true,
  emptyLabel = "選択してください",
  normalizeNull = false,
}: Props) {
  const v = useMemo(() => (value == null ? "" : String(value)), [value]);

  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>

      <select
        className={inputClass(!!error)}
        value={v}
        onChange={(e) => {
          const next = e.target.value;
          if (normalizeNull && next === "") onChange("");
          else onChange(next);
        }}
        disabled={disabled}
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {PREFECTURES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <FieldError messages={errorMessages} />
    </div>
  );
}