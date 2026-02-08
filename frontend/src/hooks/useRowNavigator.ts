import { useCallback, useMemo } from "react";

type Options<T> = {
  rows: T[];
  getId: (row: T) => number;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;

  /** 編集中などで移動を禁止したい時 */
  canNavigate?: boolean;
};

export function useRowNavigator<T>({
  rows,
  getId,
  selectedId,
  setSelectedId,
  canNavigate = true,
}: Options<T>) {
  const selectedIndex = useMemo(() => {
    if (selectedId == null) return -1;
    return rows.findIndex((r) => getId(r) === selectedId);
  }, [rows, selectedId, getId]);

  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < rows.length - 1;

  const goPrev = useCallback(() => {
    if (!canNavigate) return;
    if (!hasPrev) return;
    const prev = rows[selectedIndex - 1];
    setSelectedId(getId(prev));
  }, [canNavigate, hasPrev, rows, selectedIndex, setSelectedId, getId]);

  const goNext = useCallback(() => {
    if (!canNavigate) return;
    if (!hasNext) return;
    const next = rows[selectedIndex + 1];
    setSelectedId(getId(next));
  }, [canNavigate, hasNext, rows, selectedIndex, setSelectedId, getId]);

  return { selectedIndex, hasPrev, hasNext, goPrev, goNext };
}