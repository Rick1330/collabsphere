const requirements = [
  { label: "8+ chars", test: (pw: string) => pw.length >= 8 },
  { label: "Upper & lower", test: (pw: string) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { label: "A number", test: (pw: string) => /\d/.test(pw) },
  { label: "Special char", test: (pw: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

export function getPasswordStrength(password: string): number {
  return requirements.filter((r) => r.test(password)).length;
}

const strengthLabels = ["", "WEAK", "FAIR", "GOOD", "STRONG"] as const;
const strengthColors = ["", "rgba(239,68,68,0.7)", "rgba(245,158,11,0.7)", "rgba(245,158,11,0.7)", "rgba(16,185,129,0.7)"];
const strengthTextColors = ["", "rgba(248,113,113,0.7)", "rgba(251,191,36,0.7)", "rgba(251,191,36,0.7)", "rgba(52,211,153,0.7)"];

const filledColors = [
  "rgba(239,68,68,0.7)",
  "rgba(245,158,11,0.7)",
  "rgba(245,158,11,0.7)",
  "rgba(16,185,129,0.7)",
];

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const strength = getPasswordStrength(password);

  return (
    <div className="mt-3">
      {/* Bar */}
      <div className="flex items-center gap-1.5">
        <div className="flex gap-1.5 flex-1" role="meter" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={4} aria-label="Password strength" aria-valuetext={strength > 0 ? strengthLabels[strength] : "empty"}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{ background: i < strength ? filledColors[strength - 1] : "rgba(51,65,85,0.5)" }}
            />
          ))}
        </div>
        {strength > 0 && (
          <span className="font-mono-cs text-[10px] tracking-wider" style={{ color: strengthTextColors[strength] }}>
            {strengthLabels[strength]}
          </span>
        )}
      </div>

      {/* Checklist */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3" aria-label="Password requirements">
        {requirements.map((req) => {
          const met = req.test(password);
          return (
            <li key={req.label} className="flex items-center gap-2" aria-label={`${req.label} — ${met ? "met" : "not met"}`}>
              {met ? (
                <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8.5L6.5 12L13 4"
                    stroke="rgba(16,185,129,0.7)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-[draw_0.3s_ease-out_forwards]"
                    style={{ strokeDasharray: 20, strokeDashoffset: 0 }}
                  />
                </svg>
              ) : (
                <span className="h-3.5 w-3.5 flex-shrink-0 flex items-center justify-center text-[8px]" style={{ color: "var(--cs-text-faint)" }}>—</span>
              )}
              <span className="text-[11px]" style={{ color: met ? "var(--cs-text-body)" : "var(--cs-text-faint)" }}>
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
