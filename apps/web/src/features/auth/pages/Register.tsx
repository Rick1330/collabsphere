import { Link } from "react-router-dom";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

const Register = () => (
  <AuthLayout
    footer={
      <>
        <span style={{ color: "var(--cs-text-faint)" }}>Already have an account?</span>{" "}
        <Link
          to="/login"
          className="font-medium transition-colors duration-150"
          style={{ color: "rgba(45,212,191,0.8)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#2DD4BF"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(45,212,191,0.8)"; }}
        >
          Sign in
        </Link>
      </>
    }
  >
    <RegisterForm />
  </AuthLayout>
);

export default Register;
