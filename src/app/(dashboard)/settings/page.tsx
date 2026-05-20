import { UserProfile } from "@clerk/nextjs";
import PageHeader from "@/components/ui/PageHeader";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Settings" subtitle="Account and workspace configuration" />
      <div className="flex-1 overflow-auto p-8">
        <UserProfile
          appearance={{
            variables: {
              colorBackground: "#0f1014",
              colorInputBackground: "#14161b",
              colorInputText: "#e8eaed",
              colorText: "#e8eaed",
              colorTextSecondary: "#8b9099",
              colorPrimary: "#3b82f6",
              colorNeutral: "#1e2229",
              borderRadius: "4px",
              fontFamily: "Inter, system-ui, sans-serif",
            },
            elements: {
              card: { boxShadow: "none", border: "1px solid #1e2229", background: "#0f1014" },
              navbar: { background: "#0a0b0d", borderRight: "1px solid #1e2229" },
              navbarButton: { color: "#8b9099" },
              navbarButtonActive: { color: "#e8eaed", background: "rgba(59,130,246,0.12)" },
              pageScrollBox: { background: "#0f1014" },
            },
          }}
        />
      </div>
    </div>
  );
}
