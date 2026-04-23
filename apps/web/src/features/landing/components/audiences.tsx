import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

const tabs = ["Professional", "Academic"] as const;

const FeatureItem = ({ text, color }: { text: string; color: string }) => (
  <div className="flex items-start gap-3">
    <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}1A` }}>
      <Check className="h-3 w-3" style={{ color }} />
    </div>
    <span className="text-sm leading-relaxed" style={{ color: "var(--cs-text-body)" }}>{text}</span>
  </div>
);

const KanbanMockup = () => {
  const cols = [
    { title: "To Do", cards: ["Setup CI pipeline", "Design system audit"] },
    { title: "In Progress", cards: ["API integration", "Auth flow"] },
    { title: "Review", cards: ["Dashboard UI"] },
    { title: "Done", cards: ["Project setup", "DB schema"] },
  ];
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(20,184,166,0.12)", background: "var(--cs-surface)" }}>
      <div className="h-8 flex items-center px-3 gap-1.5 border-b" style={{ borderColor: "rgba(20,184,166,0.08)" }}>
        <div className="h-2 w-2 rounded-full" style={{ background: "rgba(239,68,68,0.3)" }} />
        <div className="h-2 w-2 rounded-full" style={{ background: "rgba(245,158,11,0.3)" }} />
        <div className="h-2 w-2 rounded-full" style={{ background: "rgba(16,185,129,0.3)" }} />
      </div>
      <div className="grid grid-cols-4 gap-2 p-3">
        {cols.map(col => (
          <div key={col.title}>
            <div className="font-mono-cs text-[9px] uppercase tracking-wider mb-2" style={{ color: "var(--cs-text-faint)" }}>{col.title}</div>
            <div className="space-y-1.5">
              {col.cards.map(c => (
                <div key={c} className="rounded border p-2 text-[10px]" style={{ borderColor: "rgba(20,184,166,0.08)", background: "var(--cs-base)", color: "var(--cs-text-body)" }}>
                  {c}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SubmissionMockup = () => {
  const rows = [
    { title: "Literature Review Ch.3", student: "Sarah Chen", status: "Approved", statusColor: "#10B981" },
    { title: "Methodology Draft", student: "James Park", status: "Changes Requested", statusColor: "#EF4444" },
    { title: "Data Analysis Results", student: "Maria Lopez", status: "Submitted", statusColor: "#F59E0B" },
  ];
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(20,184,166,0.12)", background: "var(--cs-surface)" }}>
      <div className="h-8 flex items-center px-3 gap-1.5 border-b" style={{ borderColor: "rgba(20,184,166,0.08)" }}>
        <div className="h-2 w-2 rounded-full" style={{ background: "rgba(239,68,68,0.3)" }} />
        <div className="h-2 w-2 rounded-full" style={{ background: "rgba(245,158,11,0.3)" }} />
        <div className="h-2 w-2 rounded-full" style={{ background: "rgba(16,185,129,0.3)" }} />
      </div>
      <div className="p-3 space-y-2">
        {rows.map(r => (
          <div key={r.title} className="flex items-center gap-3 rounded border p-2.5" style={{ borderColor: "rgba(20,184,166,0.08)", background: "var(--cs-base)" }}>
            <div className="flex-1">
              <div className="text-[11px] font-medium" style={{ color: "var(--cs-text-headline)" }}>{r.title}</div>
              <div className="font-mono-cs text-[10px]" style={{ color: "var(--cs-text-faint)" }}>{r.student}</div>
            </div>
            <span className="font-mono-cs text-[9px] px-2 py-0.5 rounded-full" style={{ background: `${r.statusColor}1A`, color: r.statusColor }}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Audiences = () => {
  const [active, setActive] = useState<typeof tabs[number]>("Professional");
  const reduced = useReducedMotion();

  return (
    <section className="py-24 sm:py-32 lg:py-40 max-w-7xl mx-auto px-6">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="font-mono-cs text-[11px] tracking-[0.2em] uppercase" style={{ color: "rgba(45,212,191,0.5)" }}>DUAL-MODE ARCHITECTURE</span>
        <h2 className="cs-headline text-3xl sm:text-4xl lg:text-5xl mt-4">Two environments. One underlying architecture.</h2>
        <p className="text-lg mt-4" style={{ color: "var(--cs-text-body)" }}>
          The same powerful workspace engine, configured for how your team actually works.
        </p>
      </div>

      <div className="flex justify-center mt-8">
        <div className="inline-flex p-1 rounded-lg border" style={{ background: "var(--cs-surface)", borderColor: "rgba(20,184,166,0.12)" }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className="relative px-5 py-2 rounded-md text-sm font-medium transition-colors z-10 cs-focus"
              style={{ color: active === tab ? "var(--cs-text-headline)" : "var(--cs-text-muted)" }}
            >
              {active === tab && (
                <motion.div
                  layoutId="audience-tab-indicator"
                  className="absolute inset-0 rounded-md"
                  style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.2)" }}
                  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <AnimatePresence mode="wait">
          {active === "Professional" ? (
            <motion.div
              key="pro"
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <KanbanMockup />
              <div>
                <span className="font-mono-cs text-[10px] tracking-[0.15em]" style={{ color: "rgba(14,165,233,0.6)" }}>PROFESSIONAL MODE</span>
                <h3 className="text-2xl font-bold mt-3" style={{ color: "var(--cs-text-headline)" }}>Ship faster, together</h3>
                <div className="mt-5 space-y-4">
                  <FeatureItem color="#14B8A6" text="Sprint boards with drag-and-drop task management and real-time status updates across your team" />
                  <FeatureItem color="#14B8A6" text="Technical documentation with CRDT-powered real-time co-editing — no more merge conflicts" />
                  <FeatureItem color="#14B8A6" text="Role-based access: Tech Lead, Developer, Stakeholder — roles that match how your team operates" />
                  <FeatureItem color="#14B8A6" text="Command palette and keyboard shortcuts for every action — built for developers" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="acad"
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <SubmissionMockup />
              <div>
                <span className="font-mono-cs text-[10px] tracking-[0.15em]" style={{ color: "rgba(245,158,11,0.6)" }}>ACADEMIC MODE</span>
                <h3 className="text-2xl font-bold mt-3" style={{ color: "var(--cs-text-headline)" }}>Research and write, together</h3>
                <div className="mt-5 space-y-4">
                  <FeatureItem color="#F59E0B" text="Structured workspaces for thesis groups, senior projects, and lab assignments with built-in folder hierarchies" />
                  <FeatureItem color="#F59E0B" text="Supervisor oversight with read-only review roles, document locking, and structured submission workflows" />
                  <FeatureItem color="#F59E0B" text="Document submission and approval pipeline — submit, receive feedback, revise, get approved" />
                  <FeatureItem color="#F59E0B" text="Contribution tracking and activity audit so every team member's work is visible and fairly assessed" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
