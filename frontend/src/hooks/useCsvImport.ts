import { normalizeApiError } from "../lib/errors";

type Options = {
  importFn: (file: File) => Promise<unknown>;
  onSuccess?: () => void;
  onError?: (fieldErrors: Record<string, string[]> | null, message: string) => void;
};

export function useCsvImport({ importFn, onSuccess, onError }: Options) {
  const importCsv = async (file: File) => {
    try {
      await importFn(file);
      onSuccess?.();
    } catch (e) {
      const ne = normalizeApiError(e);
      onError?.(ne.fieldErrors, ne.message);
    }
  };

  return { importCsv };
}