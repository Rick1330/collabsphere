import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type PublicAuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  accentLabel: string;
  accentValue: string;
  highlights: readonly string[];
  panelLead: string;
  panelTitle: string;
  panelDescription: string;
  footerPrompt: string;
  footerHref: string;
  footerLabel: string;
  children: ReactNode;
};

type AuthStatusCardProps = {
  eyebrow: string;
  title: string;
  body: string;
  tone?: "default" | "warning" | "danger" | "success";
  children?: ReactNode;
};

type AuthErrorBannerProps = {
  message: string;
};

type AuthDividerProps = {
  label: string;
};

type OAuthButtonProps = {
  href: string;
  label: string;
};

const authStatusStyles: Record<
  NonNullable<AuthStatusCardProps["tone"]>,
  CSSProperties | undefined
> = {
  default: undefined,
  success: {
    backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)",
    borderColor: "color-mix(in srgb, var(--color-success) 40%, transparent)",
  },
  warning: {
    backgroundColor: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
    borderColor: "color-mix(in srgb, var(--color-warning) 40%, transparent)",
  },
  danger: {
    backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)",
    borderColor: "color-mix(in srgb, var(--color-error) 40%, transparent)",
  },
};

export function PublicAuthShell({
  accentLabel,
  accentValue,
  children,
  description,
  eyebrow,
  footerHref,
  footerLabel,
  footerPrompt,
  highlights,
  panelDescription,
  panelLead,
  panelTitle,
  title,
}: Readonly<PublicAuthShellProps>) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-7xl items-center px-6 py-10 lg:px-10">
      <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-text-tertiary)]">
              {eyebrow}
            </p>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
              {description}
            </p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[rgba(12,25,24,0.84)] px-4 py-2 text-sm text-[var(--color-text-secondary)] shadow-soft">
            <span className="text-[var(--color-accent)]">{accentLabel}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-border)]" />
            <span className="text-[var(--color-text-primary)]">{accentValue}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((highlight, index) => (
              <article
                key={`highlight-${index}`}
                className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(12,25,24,0.8)] p-5 shadow-soft"
              >
                <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
                  {highlight}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--color-border)] bg-[rgba(8,18,18,0.9)] p-6 shadow-elevated backdrop-blur-xl sm:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-tertiary)]">
              {panelLead}
            </p>
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {panelTitle}
            </h2>
            <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
              {panelDescription}
            </p>
          </div>
          <div className="space-y-6">{children}</div>
          <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
            {footerPrompt}{" "}
            <Link
              href={footerHref}
              className="font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              {footerLabel}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

export function AuthStatusCard({
  body,
  children,
  eyebrow,
  title,
  tone = "default",
}: Readonly<AuthStatusCardProps>) {
  return (
    <section
      className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(12,25,24,0.74)] p-5"
      style={authStatusStyles[tone]}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-xl font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
        {body}
      </p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

export function AuthErrorBanner({ message }: Readonly<AuthErrorBannerProps>) {
  return (
    <div
      role="alert"
      className="rounded-[1.25rem] border px-4 py-3 text-sm text-[var(--color-error)]"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--color-error) 12%, transparent)",
        borderColor:
          "color-mix(in srgb, var(--color-error) 45%, transparent)",
      }}
    >
      {message}
    </div>
  );
}

export function AuthDivider({ label }: Readonly<AuthDividerProps>) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-[var(--color-border)]" />
      <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <span className="h-px flex-1 bg-[var(--color-border)]" />
    </div>
  );
}

export function OAuthButton({ href, label }: Readonly<OAuthButtonProps>) {
  return (
    <Link
      href={href}
      className="flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[rgba(12,25,24,0.88)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] shadow-soft transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
    >
      {label}
    </Link>
  );
}
