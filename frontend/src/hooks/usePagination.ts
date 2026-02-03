import { useCallback, useMemo, useState } from "react";

type Options = {
  initialPage?: number;
  pageSize: number;
};

export function usePagination({ initialPage = 1, pageSize }: Options) {
  const [page, setPage] = useState<number>(initialPage);

  const reset = useCallback(() => setPage(1), []);
  const set = useCallback((p: number) => setPage(Math.max(1, p)), []);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
  return { page, pageSize, setPage: set, reset, offset };
}
