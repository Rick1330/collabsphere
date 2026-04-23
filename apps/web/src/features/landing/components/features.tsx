import { motion, useReducedMotion } from "framer-motion";
import { Shield } from "lucide-react";
import { SpotlightGrid } from "./spotlight-grid";
import { TypingTerminal } from "./typing-terminal";
import { FlowConnector } from "./flow-connector";

const FeatureCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-8 lg:p-10 relative border-b lg:border-b ${className}`} style={{ borderColor: "rgba(20,184,166,0.1)" }}>
    {children}
  </div>
);

const Pills = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-2 mt-4">
    {items.map(i => <span key={i} className="cs-pill">{i}</span>)}
  </div>
);

type Workspace = {
  name: string;
  type: "professional" | "academic";
  typeColor: string;
  dot: string;
  docs: number;
  tasks: number;
  members: { initials: string; color: string }[];
  recent: { kind: "doc" | "task" | "comment"; text: string; meta: string }[];
  opacity: number;
  offset: number;
};

const WORKSPACES: Workspace[] = [
  {
    name: "Project Alpha",
    type: "professional",
    typeColor: "#0EA5E9",
    dot: "#14B8A6",
    docs: 24,
    tasks: 13,
    members: [
      { initials: "ET", color: "#0D9488" },
      { initials: "EB", color: "#0284C7" },
      { initials: "YG", color: "#D97706" },
      { initials: "HM", color: "#7C3AED" },
      { initials: "+3", color: "#475569" },
    ],
    recent: [
      { kind: "doc", text: "API contract — v2", meta: "Eyob · 4m" },
      { kind: "task", text: "Wire OAuth callback", meta: "Yonas · in review" },
      { kind: "comment", text: "Looks good, ship it", meta: "Elshaday · just now" },
    ],
    opacity: 1,
    offset: 0,
  },
  {
    name: "Senior Thesis",
    type: "academic",
    typeColor: "#F59E0B",
    dot: "#F59E0B",
    docs: 8,
    tasks: 5,
    members: [
      { initials: "SA", color: "#D97706" },
      { initials: "BT", color: "#7C3AED" },
      { initials: "+2", color: "#475569" },
    ],
    recent: [],
    opacity: 0.6,
    offset: 10,
  },
  {
    name: "Lab Project",
    type: "academic",
    typeColor: "#F59E0B",
    dot: "#F59E0B",
    docs: 4,
    tasks: 3,
    members: [
      { initials: "NF", color: "#0D9488" },
      { initials: "+2", color: "#475569" },
    ],
    recent: [],
    opacity: 0.32,
    offset: 20,
  },
];

const KindGlyph = ({ kind }: { kind: "doc" | "task" | "comment" }) => {
  if (kind === "doc") return <span aria-hidden="true">📄</span>;
  if (kind === "task") return <span aria-hidden="true">✓</span>;
  return <span aria-hidden="true">💬</span>;
};

const WorkspaceCards = () => {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="mt-6 relative h-[300px]"
      whileHover={reduced ? undefined : "hover"}
    >
      {WORKSPACES.map((c, i) => {
        const isFront = i === 0;
        return (
          <motion.div
            key={c.name}
            className="absolute left-0 right-0 rounded-xl border overflow-hidden"
            style={{
              borderColor: isFront ? "rgba(20,184,166,0.28)" : "rgba(20,184,166,0.15)",
              background: "var(--cs-surface)",
              opacity: c.opacity,
              top: reduced ? i * 100 : c.offset,
              left: c.offset,
              right: c.offset,
              zIndex: 3 - i,
              boxShadow: isFront
                ? "0 12px 40px -12px rgba(20,184,166,0.18), 0 1px 0 rgba(255,255,255,0.03) inset"
                : "0 4px 16px -8px rgba(0,0,0,0.4)",
            }}
            variants={reduced ? undefined : { hover: { y: (i - 1) * 6, x: (i - 1) * 4 } }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
          >
            {/* Header bar */}
            <div
              className="flex items-center gap-2 px-4 py-2.5 border-b"
              style={{ borderColor: "rgba(20,184,166,0.08)" }}
            >
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: c.dot }} />
              <span
                className="font-mono-cs text-[12px] font-semibold"
                style={{ color: "var(--cs-text-headline)" }}
              >
                {c.name}
              </span>
              <span
                className="font-mono-cs text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider"
                style={{
                  background: `${c.typeColor}10`,
                  color: `${c.typeColor}B3`,
                  borderColor: `${c.typeColor}33`,
                }}
              >
                {c.type}
              </span>
              <div className="ml-auto flex -space-x-1.5">
                {c.members.map((m, mi) => (
                  <div
                    key={mi}
                    className="h-5 w-5 rounded-full flex items-center justify-center font-mono-cs text-[8px] font-semibold ring-2"
                    style={{
                      background: m.color,
                      color: "white",
                      // @ts-expect-error CSS var
                      "--tw-ring-color": "var(--cs-surface)",
                    }}
                  >
                    {m.initials}
                  </div>
                ))}
              </div>
            </div>

            {isFront && (
              <div className="px-4 pt-3 pb-4">
                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div
                    className="rounded-md border px-2.5 py-2"
                    style={{ borderColor: "rgba(20,184,166,0.12)", background: "rgba(20,184,166,0.04)" }}
                  >
                    <div className="font-mono-cs text-[9px] uppercase tracking-wider" style={{ color: "var(--cs-text-faint)" }}>Docs</div>
                    <div className="font-mono-cs text-base font-semibold mt-0.5" style={{ color: "var(--cs-text-headline)" }}>{c.docs}</div>
                  </div>
                  <div
                    className="rounded-md border px-2.5 py-2"
                    style={{ borderColor: "rgba(20,184,166,0.12)", background: "rgba(20,184,166,0.04)" }}
                  >
                    <div className="font-mono-cs text-[9px] uppercase tracking-wider" style={{ color: "var(--cs-text-faint)" }}>Tasks</div>
                    <div className="font-mono-cs text-base font-semibold mt-0.5" style={{ color: "var(--cs-text-headline)" }}>{c.tasks}</div>
                  </div>
                  <div
                    className="rounded-md border px-2.5 py-2"
                    style={{ borderColor: "rgba(20,184,166,0.12)", background: "rgba(20,184,166,0.04)" }}
                  >
                    <div className="font-mono-cs text-[9px] uppercase tracking-wider" style={{ color: "var(--cs-text-faint)" }}>Members</div>
                    <div className="font-mono-cs text-base font-semibold mt-0.5" style={{ color: "var(--cs-text-headline)" }}>{c.members.reduce((acc, m) => acc + (m.initials.startsWith("+") ? parseInt(m.initials.slice(1), 10) : 1), 0)}</div>
                  </div>
                </div>

                {/* Recent activity stream */}
                <div className="space-y-1.5">
                  <div className="font-mono-cs text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--cs-text-faint)" }}>
                    Live activity
                  </div>
                  {c.recent.map((r, ri) => (
                    <div
                      key={ri}
                      className="flex items-center gap-2 text-[11px]"
                      style={{ color: "var(--cs-text-body)" }}
                    >
                      <KindGlyph kind={r.kind} />
                      <span className="truncate" style={{ color: "var(--cs-text-headline)" }}>{r.text}</span>
                      <span className="ml-auto font-mono-cs text-[9px] shrink-0" style={{ color: "var(--cs-text-faint)" }}>
                        {r.meta}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export const Features = () => (
  <section id="features" className="py-24 sm:py-32 lg:py-40 max-w-7xl mx-auto px-6">
    <div className="text-center max-w-2xl mx-auto mb-16">
      <span className="font-mono-cs text-[11px] tracking-[0.2em] uppercase" style={{ color: "rgba(45,212,191,0.5)" }}>CORE ARCHITECTURE</span>
      <h2 className="cs-headline text-3xl sm:text-4xl lg:text-5xl mt-4">Three capabilities. Deeply integrated.</h2>
      <p className="text-lg mt-4 max-w-xl mx-auto" style={{ color: "var(--cs-text-body)" }}>
        Each feature is powerful alone. Together, they eliminate the gaps between thinking, writing, and executing.
      </p>
    </div>
    <SpotlightGrid>
      <FeatureCell className="lg:border-r">
        <span className="font-mono-cs text-[10px] tracking-[0.15em] uppercase" style={{ color: "rgba(45,212,191,0.4)" }}>01 — COLLABORATION</span>
        <h3 className="text-xl font-bold mt-4" style={{ color: "var(--cs-text-headline)" }}>Real-time documents</h3>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--cs-text-body)" }}>
          Write together in a rich-text editor powered by CRDT conflict resolution. See who's editing, leave threaded comments, and track every version.
        </p>
        <TypingTerminal />
        <Pills items={["Live cursors", "Version history", "Threaded comments"]} />
      </FeatureCell>

      <FeatureCell className="lg:border-r">
        <span className="font-mono-cs text-[10px] tracking-[0.15em] uppercase" style={{ color: "rgba(45,212,191,0.4)" }}>02 — EXECUTION</span>
        <h3 className="text-xl font-bold mt-4" style={{ color: "var(--cs-text-headline)" }}>Visual task management</h3>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--cs-text-body)" }}>
          Organize work with Kanban boards and sortable list views. Assign tasks, set priorities and due dates, drag to reorder. Keyboard shortcuts for everything.
        </p>
        <FlowConnector />
        <Pills items={["Kanban board", "List view", "Keyboard-first"]} />
      </FeatureCell>

      <FeatureCell>
        <span className="font-mono-cs text-[10px] tracking-[0.15em] uppercase" style={{ color: "rgba(45,212,191,0.4)" }}>03 — ISOLATION</span>
        <h3 className="text-xl font-bold mt-4" style={{ color: "var(--cs-text-headline)" }}>Structured workspaces</h3>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--cs-text-body)" }}>
          Every project gets its own isolated workspace with documents, tasks, members, and activity. Role-based access ensures the right people have the right permissions.
        </p>
        <WorkspaceCards />
        <div className="font-mono-cs text-[10px] text-center mt-3 flex items-center justify-center gap-2" style={{ color: "var(--cs-text-faint)" }}>
          <Shield className="h-3 w-3" /> Workspace data never leaks across boundaries
        </div>
        <Pills items={["Templates", "5-tier RBAC", "Activity feed"]} />
      </FeatureCell>
    </SpotlightGrid>
  </section>
);
