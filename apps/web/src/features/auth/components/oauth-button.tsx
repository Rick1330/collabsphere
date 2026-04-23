import { useState } from "react";
import { Loader2 } from "lucide-react";

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.56-2.77z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

interface OAuthButtonProps {
  label?: string;
}

export const OAuthButton = ({ label = "Continue with Google" }: OAuthButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    // OAuth redirect would go here
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-3 transition-all duration-150 cs-focus disabled:opacity-50"
      style={{
        background: "var(--cs-base)",
        border: "1px solid var(--cs-teal-faint)",
        color: "var(--cs-text-body)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(20,184,166,0.25)";
        e.currentTarget.style.color = "var(--cs-text-headline)";
        e.currentTarget.style.background = "var(--cs-surface)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--cs-teal-faint)";
        e.currentTarget.style.color = "var(--cs-text-body)";
        e.currentTarget.style.background = "var(--cs-base)";
      }}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--cs-text-muted)" }} />
          <span>Redirecting…</span>
        </>
      ) : (
        <>
          <GoogleLogo />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
