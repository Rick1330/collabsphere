import { PublicAuthShell } from "../../../components/auth/auth-shell";
import { LoginForm } from "../../../components/auth/login-form";

export default function LoginPage() {
  return (
    <PublicAuthShell
      eyebrow="Sign in"
      title="Return to the workspace without losing context."
      description="Use your verified local account or continue with Google. The product shell stays warm and focused after authentication; this entry surface stays intentionally darker and more secure."
      accentLabel="Session integrity"
      accentValue="JWT + refresh rotation"
      highlights={[
        "Redirects back to the protected route that triggered login.",
        "Blocks access for unverified and deactivated accounts truthfully.",
        "Handles network, validation, and provider-entry errors without raw payload leaks.",
      ]}
      panelLead="Secure entry point"
      panelTitle="Sign in to CollabSphere"
      panelDescription="Use the same account across documents, tasks, and collaboration spaces."
      footerPrompt="New here?"
      footerHref="/register"
      footerLabel="Create an account"
    >
      <LoginForm />
    </PublicAuthShell>
  );
}
