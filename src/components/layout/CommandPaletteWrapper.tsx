"use client";

import { useEffect, useState } from "react";
import CommandPalette from "@/components/ui/CommandPalette";

export default function CommandPaletteWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {children}
      {open && <CommandPalette onClose={() => setOpen(false)} />}
    </>
  );
}
