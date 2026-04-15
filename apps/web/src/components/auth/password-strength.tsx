"use client";

type PasswordStrength = {
  label: string;
  score: number;
};

const getPasswordScore = (password: string) => {
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }
  if (/[A-Z]/u.test(password)) {
    score += 1;
  }
  if (/[a-z]/u.test(password)) {
    score += 1;
  }
  if (/\d/u.test(password)) {
    score += 1;
  }
  if (/[^A-Za-z0-9]/u.test(password)) {
    score += 1;
  }

  return score;
};

export const describePasswordStrength = (password: string): PasswordStrength => {
  const score = getPasswordScore(password);

  if (score >= 5) {
    return { label: "Strong", score };
  }

  if (score >= 4) {
    return { label: "Good", score };
  }

  if (score >= 2) {
    return { label: "Weak", score };
  }

  return { label: "Very weak", score };
};

export function PasswordStrength({ password }: Readonly<{ password: string }>) {
  const { label, score } = describePasswordStrength(password);
  const fillClass =
    score >= 5
      ? "bg-emerald-400"
      : score >= 4
        ? "bg-teal-300"
        : score >= 2
          ? "bg-amber-300"
          : "bg-rose-400";

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em]">
        <span className="text-[var(--color-text-tertiary)]">Password strength</span>
        <span className="text-[var(--color-text-secondary)]">{label}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full ${
              index < score ? fillClass : "bg-[rgba(19,78,74,0.42)]"
            }`}
          />
        ))}
      </div>
      <p className="text-xs leading-6 text-[var(--color-text-secondary)]">
        Use at least 8 characters with uppercase, lowercase, number, and special
        character.
      </p>
    </div>
  );
}
