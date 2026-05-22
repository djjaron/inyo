import Sidebar from "@/components/layout/Sidebar";
import ThreeColumnLayout from "@/components/layout/ThreeColumnLayout";
import { FamilyProvider } from "@/context/FamilyContext";
import { PanelProvider } from "@/context/PanelContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FamilyProvider>
      <PanelProvider>
        <div className="flex h-full w-full overflow-hidden">
          <Sidebar />
          <ThreeColumnLayout>
            {children}
          </ThreeColumnLayout>
        </div>
      </PanelProvider>
    </FamilyProvider>
  );
}
