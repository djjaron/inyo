import Sidebar from "@/components/layout/Sidebar";
import { FamilyProvider } from "@/context/FamilyContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FamilyProvider>
      <div className="flex h-full w-full overflow-hidden">
        <Sidebar />
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: "var(--bg-base)" }}
        >
          {children}
        </main>
      </div>
    </FamilyProvider>
  );
}
