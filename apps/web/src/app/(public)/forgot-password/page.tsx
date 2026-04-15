import { ForgotPasswordForm } from "../../../components/auth/forgot-password-form";
import { PublicAuthShell } from "../../../components/auth/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <PublicAuthShell
      eyebrow="Reset access"
      title="Recover access without leaking whether an account exists."
      description="Password reset requests follow the documented non-enumerating contract and keep the interface calm even when the backend is unavailable."
      accentLabel="Security rule"
      accentValue="Non-enumerating response"
      highlights={[
        "Generic success response whether the account exists or not.",
        "Rate-limit and transport failures surface cleanly without raw server payloads.",
        "Recovery stays lightweight so users can return to sign-in quickly.",
      ]}
      panelLead="Password recovery"
      panelTitle="Request a reset link"
      panelDescription="Enter the email you use for CollabSphere and we will send the next step if the account is eligible."
      footerPrompt="Remembered your password?"
      footerHref="/login"
      footerLabel="Return to sign in"
    >
      <ForgotPasswordForm />
    </PublicAuthShell>
  );
}
