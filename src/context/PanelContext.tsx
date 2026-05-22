"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface PanelContextValue {
  panelContent: ReactNode | null;
  isPanelOpen: boolean;
  openPanel: (content: ReactNode) => void;
  closePanel: () => void;
}

const PanelContext = createContext<PanelContextValue>({
  panelContent: null,
  isPanelOpen: false,
  openPanel: () => {},
  closePanel: () => {},
});

export function PanelProvider({ children }: { children: ReactNode }) {
  const [panelContent, setPanelContent] = useState<ReactNode | null>(null);

  const openPanel = useCallback((content: ReactNode) => {
    setPanelContent(content);
  }, []);

  const closePanel = useCallback(() => {
    setPanelContent(null);
  }, []);

  return (
    <PanelContext.Provider value={{ panelContent, isPanelOpen: panelContent !== null, openPanel, closePanel }}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanel(): PanelContextValue {
  return useContext(PanelContext);
}
