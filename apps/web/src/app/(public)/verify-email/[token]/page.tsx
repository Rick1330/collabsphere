import { PublicAuthShell } from "../../../../components/auth/auth-shell";
import { VerifyEmailPanel } from "../../../../components/auth/verify-email-panel";

type VerifyEmailPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function VerifyEmailPage({
  params,
}: Readonly<VerifyEmailPageProps>) {
  const { token } = await params;

  return (
    <PublicAuthShell
      eyebrow="Verify email"
      title="Complete account activation before entering the product shell."
      description="Verification happens through the documented token endpoint and gives expired or invalid states a truthful recovery path."
      accentLabel="Activation"
      accentValue="Required for local auth"
      highlights={[
        "Successful verification leads directly back to sign-in.",
        "Expired tokens surface an explicit recovery state instead of a dead end.",
        "Resend verification uses the documented non-enumerating email contract.",
      ]}
      panelLead="Account activation"
      panelTitle="Verify your email address"
      panelDescription="We will validate the token immediately, then show the next safe action."
      footerPrompt="Want to use a different address?"
      footerHref="/register"
      footerLabel="Create a new account"
    >
      <VerifyEmailPanel token={token} />
    </PublicAuthShell>
  );
}
