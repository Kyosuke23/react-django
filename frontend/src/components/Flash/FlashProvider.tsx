import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type FlashKind = "success" | "info" | "warning" | "error";

export type FlashItem = {
  id: string;
  kind: FlashKind;
  title?: string;
  message: string;
  timeoutMs?: number; // 0/undefinedならデフォルト
  createdAt: number;
  leaving?: boolean; // 消えるフラグ
};

type FlashContextValue = {
  items: FlashItem[];
  push: (item: Omit<FlashItem, "id" | "createdAt">) => void;
  remove: (id: string) => void;
  dismiss: (id: string) => void;

  // 便利メソッド
  success: (message: string, opts?: { title?: string; timeoutMs?: number }) => void;
  info: (message: string, opts?: { title?: string; timeoutMs?: number }) => void;
  warning: (message: string, opts?: { title?: string; timeoutMs?: number }) => void;
  error: (message: string, opts?: { title?: string; timeoutMs?: number }) => void;
  clear: () => void;
};

const FlashContext = createContext<FlashContextValue | null>(null);

function genId() {
  // 衝突しにくい簡易ID（uuid不要）
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const DEFAULT_TIMEOUT = 3500;
const MAX_ITEMS = 5;
const LEAVE_MS = 200; // 消えるアニメーション時間（ms）

export function FlashProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FlashItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    const t = timersRef.current[id];
    if (t) window.clearTimeout(t);
    delete timersRef.current[id];
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, leaving: true } : x))
      );

      window.setTimeout(() => {
        remove(id);
      }, LEAVE_MS);
    },
    [remove]
  );

  const clear = useCallback(() => {
    Object.values(timersRef.current).forEach((t) => window.clearTimeout(t));
    timersRef.current = {};
    setItems([]);
  }, []);

  const push = useCallback(
    (item: Omit<FlashItem, "id" | "createdAt">) => {
      const id = genId();
      const createdAt = Date.now();
      const timeoutMs = item.timeoutMs ?? DEFAULT_TIMEOUT;

      setItems((prev) => {
        const next = [{ ...item, id, createdAt }, ...prev];
        return next.slice(0, MAX_ITEMS);
      });

      if (timeoutMs > 0) {
        timersRef.current[id] = window.setTimeout(() => dismiss(id), timeoutMs);
      }
    },
    [remove]
  );

  const api = useMemo<FlashContextValue>(() => {
    const wrap =
      (kind: FlashKind) =>
      (message: string, opts?: { title?: string; timeoutMs?: number }) =>
        push({ kind, message, title: opts?.title, timeoutMs: opts?.timeoutMs });

    return {
      items,
      push,
      remove,
      dismiss,
      clear,
      success: wrap("success"),
      info: wrap("info"),
      warning: wrap("warning"),
      error: wrap("error"),
    };
  }, [items, push, remove, clear]);

  return <FlashContext.Provider value={api}>{children}</FlashContext.Provider>;
}

export function useFlash() {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error("useFlash must be used within <FlashProvider>");
  return ctx;
}
