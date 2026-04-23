import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";

interface AuthErrorBannerProps {
  variant: "error" | "warning" | "success";
  message: string;
  action?: { label: string; onClick: () => void };
}

const config = {
  error: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
    text: "#f87171",
    Icon: AlertCircle,
  },
  warning: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    text: "#fbbf24",
    Icon: AlertTriangle,
  },
  success: {
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    text: "#34d399",
    Icon: CheckCircle,
  },
};

export const AuthErrorBanner = ({ variant, message, action }: AuthErrorBannerProps) => {
  const c = config[variant];
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="flex items-start gap-3 rounded-lg p-3 mt-4" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
        <c.Icon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: c.text }} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] leading-relaxed" style={{ color: c.text }}>{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="text-[13px] font-medium underline underline-offset-2 mt-1 transition-opacity hover:opacity-80"
              style={{ color: c.text }}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
