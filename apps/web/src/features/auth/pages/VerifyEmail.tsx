import { useParams } from "react-router-dom";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { VerifyEmailHandler } from "@/features/auth/components/verify-email-handler";

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();

  return (
    <AuthLayout>
      {/*
        The `key` prop forces a fresh component instance whenever the route token
        changes. React Router v6 reuses the same VerifyEmailHandler instance across
        param-only navigations, which would otherwise leave the internal mutation
        ref guard in its already-fired state and prevent re-verification.
        Do NOT remove without first re-architecting the handler's effect logic.
      */}
      <VerifyEmailHandler key={token || "missing"} token={token || ""} />
    </AuthLayout>
  );
};

export default VerifyEmail;
