import { useCallback, useState } from "react";

/**
 * Small helper for open/close UI states (drawer, modal, slide-over...).
 * Keep it tiny so it stays reusable across screens.
 */
export function useDisclosure(initialOpen = false) {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return { isOpen, open, close, toggle, setIsOpen };
}
