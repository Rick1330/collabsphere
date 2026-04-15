import { PublicAuthShell } from "../../../../components/auth/auth-shell";
import { ResetPasswordForm } from "../../../../components/auth/reset-password-form";

type ResetPasswordPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ResetPasswordPage({
  params,
}: Readonly<ResetPasswordPageProps>) {
  const { token } = await params;

  return (
    <PublicAuthShell
      eyebrow="Set a new password"
      title="Replace the compromised secret and return cleanly."
      description="Reset requests use the documented token flow and fail truthfully when the token is missing, expired, or already consumed."
      accentLabel="Token rule"
      accentValue="Single-use reset token"
      highlights={[
        "Invalid or expired tokens do not silently pretend success.",
        "New passwords are checked locally against the documented policy.",
        "Successful resets communicate the forced re-login consequence clearly.",
      ]}
      panelLead="Credential renewal"
      panelTitle="Choose a new password"
      panelDescription="Use a strong password that meets the local policy before you submit."
      footerPrompt="Need a new email?"
      footerHref="/forgot-password"
      footerLabel="Request another reset link"
    >
      <ResetPasswordForm token={token} />
    </PublicAuthShell>
  );
}
