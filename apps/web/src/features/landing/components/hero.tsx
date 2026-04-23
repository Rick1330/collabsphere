import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { CursorField } from "./cursor-field";
import { MagneticButton } from "./magnetic-button";

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.12 } },
};

const fadeBlurUp = {
  initial: { opacity: 0, filter: "blur(6px)", y: 16 },
  animate: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] } },
};

/* Inline HTML/CSS product mockup — no AI image */
const ProductMockup = () => (
  <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(20,184,166,0.12)" }}>
    {/* Browser chrome */}
    <div className="h-10 flex items-center px-4 gap-2" style={{ background: "var(--cs-surface)", borderBottom: "1px solid rgba(20,184,166,0.1)" }}>
      <div className="h-2.5 w-2.5 rounded-full" style={{ background: "rgba(239,68,68,0.4)" }} />
      <div className="h-2.5 w-2.5 rounded-full" style={{ background: "rgba(245,158,11,0.4)" }} />
      <div className="h-2.5 w-2.5 rounded-full" style={{ background: "rgba(16,185,129,0.4)" }} />
      <div className="mx-auto h-5 w-56 rounded-md flex items-center justify-center font-mono-cs text-[10px]" style={{ background: "var(--cs-base)", border: "1px solid rgba(20,184,166,0.1)", color: "var(--cs-text-faint)" }}>
        collabsphere.app/w/project-alpha
      </div>
    </div>
    {/* App UI */}
    <div className="flex" style={{ background: "var(--cs-base)", minHeight: 340 }}>
      {/* Sidebar */}
      <div className="w-48 flex-shrink-0 p-3 hidden sm:block" style={{ borderRight: "1px solid rgba(20,184,166,0.08)" }}>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md mb-1" style={{ background: "rgba(20,184,166,0.08)" }}>
          <div className="h-3.5 w-3.5 rounded" style={{ background: "var(--cs-teal-primary)" }} />
          <span className="text-[11px] font-medium" style={{ color: "var(--cs-text-headline)" }}>Documents</span>
        </div>
        {["Tasks", "Members", "Activity"].map((item) => (
          <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
            <div className="h-3.5 w-3.5 rounded" style={{ background: "rgba(20,184,166,0.1)" }} />
            <span className="text-[11px]" style={{ color: "var(--cs-text-muted)" }}>{item}</span>
          </div>
        ))}
        <div className="mt-4 px-2">
          <div className="text-[9px] font-mono-cs tracking-wider uppercase mb-2" style={{ color: "var(--cs-text-faint)" }}>Workspaces</div>
          {["Project Alpha", "Design System", "Q4 Planning"].map((ws) => (
            <div key={ws} className="text-[10px] py-1" style={{ color: "var(--cs-text-muted)" }}>{ws}</div>
          ))}
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold" style={{ color: "var(--cs-text-headline)" }}>Project Roadmap Q4</h3>
          <div className="flex items-center gap-1">
            <div className="h-5 w-5 rounded-full" style={{ background: "#2DD4BF", border: "2px solid var(--cs-base)" }} />
            <div className="h-5 w-5 rounded-full -ml-2" style={{ background: "#F59E0B", border: "2px solid var(--cs-base)" }} />
            <div className="h-5 w-5 rounded-full -ml-2" style={{ background: "#0EA5E9", border: "2px solid var(--cs-base)" }} />
            <span className="text-[10px] font-mono-cs ml-1.5" style={{ color: "var(--cs-teal-muted)" }}>3 online</span>
          </div>
        </div>
        {/* Fake document content */}
        <div className="space-y-3">
          <div className="h-2 rounded-full w-4/5" style={{ background: "rgba(20,184,166,0.08)" }} />
          <div className="h-2 rounded-full w-full" style={{ background: "rgba(20,184,166,0.05)" }} />
          <div className="h-2 rounded-full w-3/4" style={{ background: "rgba(20,184,166,0.05)" }} />
          <div className="h-px w-full my-2" style={{ background: "rgba(20,184,166,0.06)" }} />
          <div className="text-[10px] font-semibold mb-1" style={{ color: "var(--cs-text-headline)" }}>Milestones</div>
          {[
            { label: "API v2 launch", status: "Done", color: "#10B981" },
            { label: "Dashboard redesign", status: "In progress", color: "#F59E0B" },
            { label: "Mobile app beta", status: "Planned", color: "var(--cs-text-muted)" },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
              <span className="text-[10px]" style={{ color: "var(--cs-text-body)" }}>{m.label}</span>
              <span className="text-[9px] font-mono-cs ml-auto" style={{ color: m.color }}>{m.status}</span>
            </div>
          ))}
          <div className="h-px w-full my-2" style={{ background: "rgba(20,184,166,0.06)" }} />
          <div className="h-2 rounded-full w-full" style={{ background: "rgba(20,184,166,0.05)" }} />
          <div className="h-2 rounded-full w-2/3" style={{ background: "rgba(20,184,166,0.05)" }} />
          {/* Fake cursor */}
          <div className="inline-flex items-center gap-1 mt-2">
            <div className="w-0.5 h-4 rounded-full animate-cs-pulse" style={{ background: "#2DD4BF" }} />
            <span className="text-[9px] font-mono-cs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(45,212,191,0.1)", color: "#2DD4BF" }}>Jane</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const Hero = () => {
  const reduced = useReducedMotion();
  const variants = reduced ? {} : fadeBlurUp;
  const containerVariants = reduced ? {} : staggerContainer;

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <CursorField />
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 pt-20"
        initial="initial"
        animate="animate"
        variants={containerVariants}
      >
        <motion.div variants={variants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ borderColor: "rgba(20,184,166,0.15)", background: "rgba(20,184,166,0.05)" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-cs-teal-bright animate-cs-pulse" />
          <span className="font-mono-cs text-[11px] tracking-[0.15em] uppercase" style={{ color: "rgba(45,212,191,0.6)" }}>CollabSphere v1.0</span>
        </motion.div>

        <motion.h1 variants={variants} className="cs-headline text-5xl sm:text-6xl lg:text-7xl mt-8 max-w-4xl text-balance">
          One workspace for docs, tasks, and{" "}
          <span className="text-cs-teal-primary">real-time</span> collaboration
        </motion.h1>

        <motion.p variants={variants} className="text-lg sm:text-xl mt-6 max-w-2xl leading-relaxed" style={{ color: "var(--cs-text-body)" }}>
          Stop switching between five disconnected tools. CollabSphere brings documents, task boards, and team coordination together — built collaboration-first, so context flows automatically.
        </motion.p>

        <motion.div variants={variants} className="flex flex-col sm:flex-row items-center gap-3 mt-10">
          <MagneticButton href="/register">
            Get started free <ArrowRight className="h-4 w-4 ml-2" />
          </MagneticButton>
          <a href="#features" className="cs-focus cs-btn-secondary inline-flex items-center px-8 h-12 text-base">
            Watch how it works <Play className="h-4 w-4 ml-2" />
          </a>
        </motion.div>

        <motion.div variants={variants} className="mt-6 font-mono-cs text-[11px] tracking-wider flex items-center gap-3" style={{ color: "var(--cs-text-faint)" }}>
          <span>Free for teams up to 10</span>
          <span className="h-1 w-1 rounded-full bg-cs-teal-muted" />
          <span>No credit card</span>
          <span className="h-1 w-1 rounded-full bg-cs-teal-muted" />
          <span>Setup in 2 minutes</span>
        </motion.div>

        <motion.div variants={variants} className="mt-16 sm:mt-20 lg:mt-24 max-w-6xl mx-auto w-full px-4">
          <ProductMockup />
          <div className="h-40 w-3/4 mx-auto rounded-full -mt-20 hidden sm:block" style={{ background: "rgba(20,184,166,0.06)", filter: "blur(80px)" }} />
        </motion.div>
      </motion.div>
    </section>
  );
};
