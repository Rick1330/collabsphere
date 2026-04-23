import { useParams } from "react-router-dom";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();

  return (
    <AuthLayout>
      <ResetPasswordForm token={token || ""} />
    </AuthLayout>
  );
};

export default ResetPassword;
