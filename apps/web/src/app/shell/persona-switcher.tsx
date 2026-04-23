/**
 * Scenario switcher (dev/demo only).
 *
 * After Wave 44, identity comes from the auth session (real login flow).
 * This control is scoped to scenario testing: workspace role, workspace
 * type, and scenario state. Use it to exercise loading / archived /
 * empty / dense / submitted / approved branches without code edits.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FlaskConical, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SCENARIO_META,
  WORKSPACE_ROLE_META,
  WORKSPACE_TYPE_META,
  personaStore,
  usePersonaState,
  type ScenarioState,
  type WorkspaceRoleKey,
  type WorkspaceType,
} from "@/lib/persona-scenario";

const TONE_BG: Record<string, string> = {
  teal: "bg-teal-100 text-teal-800 ring-teal-200",
  amber: "bg-amber-100 text-amber-800 ring-amber-200",
  stone: "bg-stone-100 text-stone-700 ring-stone-200",
  emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  indigo: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  blue: "bg-blue-100 text-blue-800 ring-blue-200",
  red: "bg-red-100 text-red-800 ring-red-200",
};

export const PersonaSwitcher = () => {
  const state = usePersonaState();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="hidden md:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-dashed border-stone-300 hover:border-teal-400 hover:bg-teal-50/50 text-stone-600 hover:text-teal-700 text-xs font-medium transition-colors"
          aria-label="Open scenario switcher"
          title="Demo scenario switcher (dev only)"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          <span className="hidden lg:inline font-mono tracking-wide uppercase text-[10px]">Scenario</span>
          <span className="font-mono text-[10px] text-stone-400">·</span>
          <span className="font-mono text-[10px] uppercase tracking-wide">
            {SCENARIO_META[state.scenario].label}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-teal-600" />
            Demo scenario
          </SheetTitle>
          <p className="text-xs text-stone-500 leading-relaxed">
            Scenario controls are dev-only. To switch identity, sign out and
            sign in with a different demo account from the login page.
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-7">
          {/* Workspace role */}
          <Section title="Workspace role">
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(WORKSPACE_ROLE_META) as WorkspaceRoleKey[]).map((r) => {
                const active = r === state.workspaceRole;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => personaStore.set({ workspaceRole: r })}
                    className={cn(
                      "text-left px-2.5 py-2 rounded-lg border text-xs transition-colors",
                      active
                        ? "border-teal-400 bg-teal-50/60 text-teal-900"
                        : "border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700",
                    )}
                  >
                    <div className="font-semibold">{WORKSPACE_ROLE_META[r].label}</div>
                    <div className="text-[10px] text-stone-500 leading-tight mt-0.5">
                      {WORKSPACE_ROLE_META[r].description}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Workspace type */}
          <Section title="Workspace type">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(WORKSPACE_TYPE_META) as WorkspaceType[]).map((t) => {
                const active = t === state.workspaceType;
                const meta = WORKSPACE_TYPE_META[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => personaStore.set({ workspaceType: t })}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium ring-1 transition-colors",
                      active
                        ? TONE_BG[meta.tone]
                        : "bg-white text-stone-600 ring-stone-200 hover:bg-stone-50",
                    )}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Scenario */}
          <Section title="Scenario state">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(SCENARIO_META) as ScenarioState[]).map((s) => {
                const active = s === state.scenario;
                const meta = SCENARIO_META[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => personaStore.set({ scenario: s })}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium ring-1 transition-colors",
                      active
                        ? TONE_BG[meta.tone]
                        : "bg-white text-stone-600 ring-stone-200 hover:bg-stone-50",
                    )}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-stone-400 leading-relaxed">
              Scenario is a hint for surfaces that consume it (lists, feeds, editor).
              Not every page reacts to every state yet.
            </p>
          </Section>

          <div className="pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => personaStore.reset()}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to defaults
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="font-mono text-[10px] tracking-[0.2em] text-stone-400 uppercase mb-2">
      {title}
    </p>
    {children}
  </div>
);
