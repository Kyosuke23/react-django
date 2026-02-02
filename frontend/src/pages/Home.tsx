export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Home</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <p className="text-slate-700 dark:text-slate-300">
          左上の <span className="font-medium">API Check</span> から Django API との疎通確認ができます。
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          OSの外観設定（ダーク/ライト）に自動追従します。
        </p>
      </div>
    </div>
  );
}