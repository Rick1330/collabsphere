import { useParams } from "react-router-dom";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { VerifyEmailHandler } from "@/features/auth/components/verify-email-handler";

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();

  return (
    <AuthLayout>
      <VerifyEmailHandler token={token || ""} />
    </AuthLayout>
  );
};

export default VerifyEmail;
