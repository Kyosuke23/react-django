/**
 * フィールドエラー項目のUI定義
 * @param hasError
 * @returns
 */
export function inputClass(hasError: boolean) {
  return [
    "w-full rounded-lg px-3 py-2 text-sm",
    "bg-slate-950/30 text-slate-100",
    "border outline-none",
    hasError
      ? "border-rose-500 focus:ring-2 focus:ring-rose-500/40"
      : "border-slate-700 focus:ring-2 focus:ring-white/10",
  ].join(" ");
}