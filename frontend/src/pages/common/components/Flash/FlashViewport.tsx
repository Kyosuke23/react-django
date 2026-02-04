import { useFlash } from "./FlashProvider";

function kindStyle(kind: "success" | "info" | "warning" | "error") {
  switch (kind) {
    case "success":
      return "border-emerald-500/30 bg-emerald-950/40 text-emerald-100";
    case "info":
      return "border-sky-500/30 bg-sky-950/40 text-sky-100";
    case "warning":
      return "border-amber-500/30 bg-amber-950/40 text-amber-100";
    case "error":
      return "border-rose-500/30 bg-rose-950/40 text-rose-100";
  }
}

export default function FlashViewport() {
  const { items } = useFlash();

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center">
      {items.map((it) => (
        <div
          key={it.id}
          className={[
            "pointer-events-auto rounded-xl border px-4 py-3 shadow-lg backdrop-blur",
            "transition transform",
            kindStyle(it.kind),
          ].join(" ")}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {it.title ? <div className="text-sm font-semibold">{it.title}</div> : null}
              <div className="text-sm break-words">{it.message}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}