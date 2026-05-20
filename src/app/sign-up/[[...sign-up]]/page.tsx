import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div
      className="flex flex-1 items-center justify-center"
      style={{ background: "var(--bg-base)" }}
    >
      <div>
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white text-sm font-bold tracking-tight mb-4"
            style={{ background: "var(--accent)" }}
          >
            FO
          </div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Create your account
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Inyo Family Office OS
          </p>
        </div>
        <SignUp
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
              fontSize: "14px",
            },
            elements: {
              card: { boxShadow: "none", border: "1px solid #1e2229" },
              headerTitle: { display: "none" },
              headerSubtitle: { display: "none" },
              socialButtonsBlockButton: {
                background: "#14161b",
                border: "1px solid #1e2229",
                color: "#e8eaed",
              },
              dividerLine: { background: "#1e2229" },
              dividerText: { color: "#4a5060" },
              formFieldLabel: { color: "#8b9099" },
              footerActionLink: { color: "#3b82f6" },
            },
          }}
        />
      </div>
    </div>
  );
}
