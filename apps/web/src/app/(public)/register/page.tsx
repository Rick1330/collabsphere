import { PublicAuthShell } from "../../../components/auth/auth-shell";
import { RegisterForm } from "../../../components/auth/register-form";

export default function RegisterPage() {
  return (
    <PublicAuthShell
      eyebrow="Create account"
      title="Start with one calm workspace surface, not six disconnected tools."
      description="Create a verified account, then move directly into the authenticated shell without rebuilding your navigation habits later."
      accentLabel="Verification"
      accentValue="Required before sign-in"
      highlights={[
        "Password policy is enforced before the request leaves the page.",
        "Registration and verification flows stay truthful to the documented auth contract.",
        "The visual system matches the landing surface while keeping forms high-contrast and fast to scan.",
      ]}
      panelLead="Account setup"
      panelTitle="Create your CollabSphere account"
      panelDescription="Use local auth now or switch to Google if your team prefers managed identity."
      footerPrompt="Already have an account?"
      footerHref="/login"
      footerLabel="Sign in instead"
    >
      <RegisterForm />
    </PublicAuthShell>
  );
}
