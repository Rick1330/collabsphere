import { FileText, CheckSquare } from "lucide-react";

export const FlowConnector = () => (
  <div className="mt-6" aria-hidden="true">
    <div className="flex items-center gap-4">
      <div className="flex-1 rounded-lg border p-3" style={{ borderColor: "rgba(20,184,166,0.15)", background: "var(--cs-surface)" }}>
        <FileText className="h-4 w-4 text-cs-teal-primary mb-1" />
        <div className="font-mono-cs text-[11px]" style={{ color: "var(--cs-text-headline)" }}>PRD-v2.md</div>
        <div className="font-mono-cs text-[10px]" style={{ color: "var(--cs-text-faint)" }}>doc · updated 2m ago</div>
      </div>
      <svg width="80" height="40" viewBox="0 0 80 40" className="flex-shrink-0">
        <path d="M0 20 C30 20, 50 20, 80 20" stroke="rgba(20,184,166,0.3)" strokeWidth="1.5" fill="none" />
        <circle r="3" fill="#2DD4BF">
          <animateMotion dur="3s" repeatCount="indefinite" path="M0 20 C30 20, 50 20, 80 20" />
        </circle>
      </svg>
      <div className="flex-1 rounded-lg border p-3" style={{ borderColor: "rgba(20,184,166,0.15)", background: "var(--cs-surface)" }}>
        <CheckSquare className="h-4 w-4 text-cs-amber mb-1" />
        <div className="font-mono-cs text-[11px]" style={{ color: "var(--cs-text-headline)" }}>TASK-042</div>
        <div className="font-mono-cs text-[10px]" style={{ color: "var(--cs-text-faint)" }}>task · assigned to jane</div>
      </div>
    </div>
    <p className="font-mono-cs text-[10px] text-center mt-3" style={{ color: "var(--cs-text-faint)" }}>
      Context flows automatically between linked resources
    </p>
  </div>
);
