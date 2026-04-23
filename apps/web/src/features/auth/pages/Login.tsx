import { Link } from "react-router-dom";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";

const Login = () => (
  <AuthLayout
    footer={
      <>
        <span style={{ color: "var(--cs-text-faint)" }}>New to CollabSphere?</span>{" "}
        <Link
          to="/register"
          className="font-medium transition-colors duration-150"
          style={{ color: "rgba(45,212,191,0.8)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#2DD4BF"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(45,212,191,0.8)"; }}
        >
          Create an account
        </Link>
      </>
    }
  >
    <LoginForm />
  </AuthLayout>
);

export default Login;
