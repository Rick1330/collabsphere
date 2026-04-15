"use client";

type PasswordStrength = {
  label: string;
  score: number;
};

const strengthColorByScore = (score: number) => {
  if (score >= 5) {
    return "var(--color-success)";
  }

  if (score >= 4) {
    return "var(--color-accent)";
  }

  if (score >= 2) {
    return "var(--color-warning)";
  }

  return "var(--color-error)";
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
  const fillColor = strengthColorByScore(score);

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
            className="h-1.5 rounded-full"
            style={{
              backgroundColor:
                index < score
                  ? fillColor
                  : "color-mix(in srgb, var(--color-border) 55%, transparent)",
            }}
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
