"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface FamilyContextValue {
  familyId: string | null;
}

const FamilyContext = createContext<FamilyContextValue>({ familyId: null });

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [familyId, setFamilyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    const cacheKey = `inyo_fid_${user.id}`;

    // Serve cached value immediately so pages don't wait for the network
    const cached = localStorage.getItem(cacheKey);
    if (cached) setFamilyId(cached);

    // Always refresh from server (setup + return familyId in one call)
    fetch("/api/user/setup")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const id: string | null = data?.family?.id ?? data?.user?.familyId ?? null;
        if (id) {
          localStorage.setItem(cacheKey, id);
          setFamilyId(id);
        }
      })
      .catch(() => {});
  }, [isLoaded, user?.id]);

  return (
    <FamilyContext.Provider value={{ familyId }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamilyId(): string | null {
  return useContext(FamilyContext).familyId;
}
