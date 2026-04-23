export const AuthDivider = () => (
  <div className="relative my-6">
    <div className="h-px w-full" style={{ background: "var(--cs-teal-faint)" }} />
    <span
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono-cs text-[10px] tracking-[0.15em] uppercase px-3"
      style={{ color: "var(--cs-text-faint)", background: "var(--cs-surface)" }}
    >
      OR
    </span>
  </div>
);
