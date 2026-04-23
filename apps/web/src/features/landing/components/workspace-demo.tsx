import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, UserPlus, Users, FileText } from "lucide-react";

const Keycap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`cs-keycap h-9 min-w-[36px] px-2 text-xs ${className}`}>{children}</span>
);

const SmallKeycap = ({ children }: { children: React.ReactNode }) => (
  <span className="cs-keycap h-7 min-w-[28px] px-1.5 text-[11px]">{children}</span>
);

const ShortcutRow = ({ keys, label }: { keys: string[]; label: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex gap-1">
      {keys.map((k, i) => <SmallKeycap key={i}>{k}</SmallKeycap>)}
    </div>
    <span className="text-sm" style={{ color: "var(--cs-text-muted)" }}>{label}</span>
  </div>
);

const CommandPalette = () => {
  const reduced = useReducedMotion();
  const fullText = "> assign task to elshaday";
  const [typed, setTyped] = useState(reduced ? fullText : "");
  const [showResults, setShowResults] = useState(reduced);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduced) return;
    setTyped("");
    setShowResults(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i <= fullText.length) {
        setTyped(fullText.slice(0, i));
      } else if (i === fullText.length + 1) {
        setShowResults(true);
      } else if (i > fullText.length + 80) {
        clearInterval(interval);
        setCycle(c => c + 1);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [cycle, reduced]);

  const results = [
    { icon: UserPlus, label: "Assign to Elshaday Tesfaye", hint: "↵ select", highlight: true },
    { icon: Users, label: "Assign to team...", hint: "", highlight: false },
    { icon: FileText, label: "Search 'elshaday' in documents", hint: "", highlight: false },
  ];

  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -inset-4 rounded-3xl -z-10" style={{ background: "var(--cs-teal-whisper)", filter: "blur(40px)" }} />
      <div className="w-full max-w-md mx-auto rounded-xl overflow-hidden border" style={{
        borderColor: "var(--cs-teal-faint)",
        background: "var(--cs-surface)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 10px 40px -10px rgba(15,118,110,0.15), 0 0 0 1px rgba(15,118,110,0.04)",
      }}>
        <div className="border-b p-4 flex items-center gap-3" style={{ borderColor: "var(--cs-teal-faint)" }}>
          <Search className="h-4 w-4" style={{ color: "var(--cs-text-faint)" }} />
          <span className="font-mono-cs text-sm">
            <span style={{ color: "var(--cs-teal-primary)" }}>{typed.charAt(0)}</span>
            <span style={{ color: "var(--cs-text-headline)" }}>{typed.slice(1)}</span>
            {!reduced && !showResults && <span className="animate-pulse" style={{ color: "var(--cs-teal-primary)" }}>│</span>}
          </span>
        </div>
        <AnimatePresence>
          {showResults && (
            <motion.div
              className="p-2 space-y-1"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {results.map((r, i) => (
                <motion.div
                  key={r.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{
                    background: r.highlight ? "var(--cs-teal-faint)" : "transparent",
                    border: r.highlight ? "1px solid var(--cs-teal-faint)" : "1px solid transparent",
                  }}
                  initial={reduced ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <r.icon className="h-4 w-4" style={{ color: r.highlight ? "var(--cs-teal-primary)" : "var(--cs-text-muted)" }} />
                  <span className="text-sm flex-1" style={{ color: r.highlight ? "var(--cs-text-headline)" : "var(--cs-text-body)" }}>{r.label}</span>
                  {r.hint && <span className="font-mono-cs text-[10px]" style={{ color: "var(--cs-text-faint)" }}>{r.hint}</span>}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="border-t px-4 py-2 flex items-center justify-between font-mono-cs text-[10px]" style={{ borderColor: "var(--cs-teal-faint)", color: "var(--cs-text-faint)", background: "var(--cs-elevated)" }}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
};

export const WorkspaceDemo = () => (
  <section className="py-24 sm:py-32 lg:py-40 max-w-7xl mx-auto px-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div>
        <span className="font-mono-cs text-[11px] tracking-[0.2em] uppercase" style={{ color: "var(--cs-teal-primary)" }}>KEYBOARD-FIRST ARCHITECTURE</span>
        <h2 className="cs-headline text-3xl sm:text-4xl mt-4">Move at the speed of thought</h2>
        <p className="text-base mt-4 leading-relaxed" style={{ color: "var(--cs-text-body)" }}>
          Navigate workspaces, assign tasks, search documents, and trigger actions without touching your mouse. The command palette puts every action one keystroke away.
        </p>
        <div className="mt-8 flex items-center gap-2 flex-wrap">
          <Keycap>⌘</Keycap>
          <span className="text-xs" style={{ color: "var(--cs-text-faint)" }}>+</span>
          <Keycap>K</Keycap>
          <span className="mx-2" style={{ color: "var(--cs-text-faint)" }}>→</span>
          <span className="font-mono-cs text-sm" style={{ color: "var(--cs-text-body)" }}>Command Palette</span>
        </div>
        <div className="mt-6 space-y-3">
          <ShortcutRow keys={["⌘", "N"]} label="New document" />
          <ShortcutRow keys={["⌘", "⇧", "T"]} label="New task" />
          <ShortcutRow keys={["⌘", "/"]} label="Search everything" />
        </div>
      </div>
      <CommandPalette />
    </div>
  </section>
);
