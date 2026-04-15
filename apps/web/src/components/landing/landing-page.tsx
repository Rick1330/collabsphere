import Link from "next/link";

const signalCards = [
  {
    title: "Commandable workspace shell",
    body: "Jump between workspaces, documents, and tasks from one focused navigation model instead of a stack of disconnected tools.",
  },
  {
    title: "Calm collaboration by default",
    body: "Presence, activity, and notifications stay visible without drowning the primary work surface in chrome.",
  },
  {
    title: "Academic and professional friendly",
    body: "The visual language stays warm and serious enough for faculty teams, product groups, and multi-role workspaces.",
  },
] as const;

const stats = [
  { label: "Primary surfaces unified", value: "Documents · Tasks · Members" },
  { label: "Interaction model", value: "Keyboard-first with touch parity" },
  { label: "Responsive intent", value: "Desktop, tablet, and phone" },
] as const;

const workflow = [
  "Create or join a workspace",
  "Open the command palette",
  "Move from document editing into tasks and review without a context switch",
] as const;

const commandPaletteItems = [
  "Open workspace dashboard",
  "Search project charter",
  "Create task in Sprint Planning",
] as const;

function LandingHero() {
  return (
    <div className="space-y-8">
      <div className="inline-flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[rgba(12,25,24,0.86)] px-4 py-2 text-sm text-[var(--color-text-secondary)] shadow-soft">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
        Collaboration-first operating surface
      </div>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-balance text-5xl font-semibold tracking-[-0.05em] text-[var(--color-text-primary)] sm:text-6xl lg:text-7xl">
          Collaboration without context switching.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)] sm:text-xl">
          CollabSphere brings workspaces, documents, tasks, and team activity into
          one product surface so planning, writing, and execution do not fracture
          into separate tools.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/register"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-accent)] px-6 py-3 text-base font-semibold text-[var(--color-bg-primary)] shadow-soft transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
        >
          Start in one workspace
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[rgba(12,25,24,0.88)] px-6 py-3 text-base font-semibold text-[var(--color-text-primary)] shadow-soft transition-colors hover:border-[var(--color-accent)] hover:bg-[rgba(12,25,24,0.96)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
        >
          Enter the workspace
        </Link>
      </div>
    </div>
  );
}

function CommandPalettePreview() {
  return (
    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(12,25,24,0.94),rgba(8,18,18,0.84))] p-6 shadow-elevated">
      <div className="flex items-center justify-between rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(5,14,14,0.72)] px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-tertiary)]">
            Command palette preview
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Search docs, tasks, and workspace actions from one entry point.
          </p>
        </div>
        <kbd className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-primary)]">
          Ctrl/Cmd + K
        </kbd>
      </div>
      <div className="mt-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(5,14,14,0.52)] p-4">
        <div className="rounded-full border border-[var(--color-border)] bg-[rgba(12,25,24,0.9)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          Search command, document, or task
        </div>
        <div className="mt-4 space-y-3">
          {commandPaletteItems.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[rgba(12,25,24,0.8)] px-4 py-3"
            >
              <span className="text-sm text-[var(--color-text-primary)]">{item}</span>
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
                Enter
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignalCardsSection() {
  return (
    <section className="grid gap-5 lg:grid-cols-3">
      {signalCards.map((card) => (
        <article
          key={card.title}
          className="rounded-[1.75rem] border border-[var(--color-border)] bg-[rgba(12,25,24,0.84)] p-6 shadow-soft"
        >
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-tertiary)]">
            Product signal
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text-primary)]">
            {card.title}
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
            {card.body}
          </p>
        </article>
      ))}
    </section>
  );
}

function WorkflowSection() {
  return (
    <article className="rounded-[2rem] border border-[var(--color-border)] bg-[rgba(12,25,24,0.82)] p-6 shadow-soft">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-tertiary)]">
        Product operating model
      </p>
      <ol className="mt-5 space-y-4">
        {workflow.map((step, index) => (
          <li key={step} className="flex gap-4">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-sm font-semibold text-[var(--color-accent)]">
              {index + 1}
            </span>
            <p className="text-base leading-7 text-[var(--color-text-secondary)]">
              {step}
            </p>
          </li>
        ))}
      </ol>
    </article>
  );
}

function StatsGrid() {
  return (
    <article className="grid gap-4 rounded-[2rem] border border-[var(--color-border)] bg-[rgba(12,25,24,0.82)] p-6 shadow-soft md:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[1.4rem] border border-[var(--color-border)] bg-[rgba(5,14,14,0.46)] p-5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            {stat.label}
          </p>
          <p className="mt-4 text-lg font-semibold leading-7 text-[var(--color-text-primary)]">
            {stat.value}
          </p>
        </div>
      ))}
    </article>
  );
}

export function LandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-6 py-10 lg:px-10 lg:py-14">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <LandingHero />
        <CommandPalettePreview />
      </section>

      <SignalCardsSection />

      <section className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <WorkflowSection />
        <StatsGrid />
      </section>
    </div>
  );
}
