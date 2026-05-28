import Sidebar from "@/components/layout/Sidebar";
import ThreeColumnLayout from "@/components/layout/ThreeColumnLayout";
import CommandPaletteWrapper from "@/components/layout/CommandPaletteWrapper";
import { FamilyProvider } from "@/context/FamilyContext";
import { PanelProvider } from "@/context/PanelContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FamilyProvider>
      <PanelProvider>
        <CommandPaletteWrapper>
          <div className="flex h-full w-full overflow-hidden">
            <Sidebar />
            <ThreeColumnLayout>
              {children}
            </ThreeColumnLayout>
          </div>
        </CommandPaletteWrapper>
      </PanelProvider>
    </FamilyProvider>
  );
}
