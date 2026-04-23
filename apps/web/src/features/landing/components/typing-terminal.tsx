import { useState, useEffect } from "react";
import { useReducedMotion } from "framer-motion";

const lines = [
  { arrow: "→", event: "doc.update", pairs: "user:jane  latency:12ms", check: "✓ synced", color: "#2DD4BF" },
  { arrow: "→", event: "cursor.move", pairs: "user:alex  pos:{42,18}", check: "✓ broadcast", color: "#94A3B8" },
  { arrow: "→", event: "version.snapshot", pairs: "reason:auto  #v24", check: "✓ persisted", color: "#F59E0B" },
];

export const TypingTerminal = () => {
  const reduced = useReducedMotion();
  const [displayLines, setDisplayLines] = useState<string[]>(reduced ? lines.map(l => `${l.arrow} ${l.event}  ${l.pairs}  ${l.check}`) : []);
  const [currentLine, setCurrentLine] = useState(reduced ? 3 : 0);
  const [currentChar, setCurrentChar] = useState(0);

  useEffect(() => {
    if (reduced) return;
    if (currentLine >= lines.length) {
      const t = setTimeout(() => {
        setDisplayLines([]);
        setCurrentLine(0);
        setCurrentChar(0);
      }, 3000);
      return () => clearTimeout(t);
    }
    const line = lines[currentLine];
    const full = `${line.arrow} ${line.event}  ${line.pairs}  ${line.check}`;
    if (currentChar < full.length) {
      const t = setTimeout(() => {
        setDisplayLines(prev => {
          const copy = [...prev];
          copy[currentLine] = full.slice(0, currentChar + 1);
          return copy;
        });
        setCurrentChar(c => c + 1);
      }, 30);
      return () => clearTimeout(t);
    } else {
      setCurrentLine(l => l + 1);
      setCurrentChar(0);
    }
  }, [currentLine, currentChar, reduced]);

  return (
    <div className="mt-6 rounded-lg overflow-hidden border" style={{ borderColor: "rgba(20,184,166,0.12)" }} aria-hidden="true">
      <div className="h-7 flex items-center px-3 gap-1.5 border-b" style={{ background: "var(--cs-surface)", borderColor: "rgba(20,184,166,0.1)" }}>
        <div className="h-2 w-2 rounded-full" style={{ background: "rgba(239,68,68,0.3)" }} />
        <div className="h-2 w-2 rounded-full" style={{ background: "rgba(245,158,11,0.3)" }} />
        <div className="h-2 w-2 rounded-full" style={{ background: "rgba(16,185,129,0.3)" }} />
        <span className="font-mono-cs text-[10px] ml-2" style={{ color: "var(--cs-text-faint)" }}>sync.log</span>
      </div>
      <div className="p-4 font-mono-cs text-[12px] leading-relaxed min-h-[140px]" style={{ background: "var(--cs-base)" }}>
        {displayLines.map((text, i) => (
          <div key={i} style={{ color: lines[i]?.color || "#94A3B8" }}>
            {text}
            {!reduced && i === currentLine && currentLine < lines.length && (
              <span className="animate-pulse text-cs-teal-primary">█</span>
            )}
          </div>
        ))}
        {!reduced && currentLine < lines.length && displayLines.length <= currentLine && (
          <span className="animate-pulse text-cs-teal-primary">█</span>
        )}
      </div>
      <span className="sr-only">Simulation of real-time collaboration log showing document updates, cursor movements, and version snapshots with sub-15ms latency.</span>
    </div>
  );
};
