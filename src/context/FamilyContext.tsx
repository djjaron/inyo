"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface FamilyContextValue {
  familyId: string | null;
}

const FamilyContext = createContext<FamilyContextValue>({ familyId: null });

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [familyId, setFamilyId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Ensure DB record exists for this user on first login
        await fetch("/api/user/setup");

        // Now fetch the authoritative familyId
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setFamilyId(data.familyId ?? null);
        }
      } catch {
        // Network error — leave familyId as null; callers handle gracefully
      }
    }

    init();
  }, []);

  return (
    <FamilyContext.Provider value={{ familyId }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamilyId(): string | null {
  return useContext(FamilyContext).familyId;
}
