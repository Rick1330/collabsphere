import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  Bell,
  Briefcase,
  FileText,
  Keyboard,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { emitOpenHelp } from "@/lib/shortcut-events";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    setTimeout(fn, 80);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm animate-in fade-in duration-150"
        aria-hidden="true"
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-xl bg-white/95 backdrop-blur-xl
          border border-stone-200 shadow-lg overflow-hidden
          animate-in fade-in zoom-in-95 duration-150"
      >
        <Command label="Command palette" className="[&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.15em] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-stone-400 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5">
          <div className="flex items-center gap-2 px-3 h-12 border-b border-stone-100">
            <Search className="h-4 w-4 text-stone-400" />
            <Command.Input
              ref={inputRef}
              placeholder="Search workspaces, tasks, actions…"
              className="flex-1 bg-transparent outline-none text-sm text-stone-900 placeholder:text-stone-400"
            />
            <kbd className="font-mono text-[10px] text-stone-400 px-1.5 py-0.5 rounded bg-stone-50 border border-stone-200">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[360px] overflow-y-auto pb-2">
            <Command.Empty className="py-10 text-center text-sm text-stone-400">
              No results found.
            </Command.Empty>

            <Command.Group heading="Recent">
              <PaletteItem icon={Briefcase} label="Project Alpha" hint="Workspace" onSelect={() => run(() => navigate("/dashboard"))} />
              <PaletteItem icon={FileText} label="Q4 Roadmap" hint="Document" onSelect={() => run(() => navigate("/dashboard"))} />
              <PaletteItem icon={Briefcase} label="Thesis — Distributed Systems" hint="Workspace" onSelect={() => run(() => navigate("/dashboard"))} />
            </Command.Group>

            <Command.Group heading="Actions">
              <PaletteItem icon={Plus} label="Create new workspace" hint="⌘ ⇧ N" onSelect={() => run(() => navigate("/dashboard"))} />
              <PaletteItem icon={Plus} label="New document" hint="⌘ ⇧ D" onSelect={() => run(() => navigate("/dashboard"))} />
              <PaletteItem icon={Users} label="Invite teammates" onSelect={() => run(() => navigate("/dashboard"))} />
            </Command.Group>

            <Command.Group heading="Navigation">
              <PaletteItem icon={LayoutDashboard} label="Dashboard" hint="G D" onSelect={() => run(() => navigate("/dashboard"))} />
              <PaletteItem icon={Briefcase} label="All workspaces" hint="G W" onSelect={() => run(() => navigate("/workspaces"))} />
              <PaletteItem icon={Bell} label="Notifications" hint="G N" onSelect={() => run(() => navigate("/notifications"))} />
              <PaletteItem icon={Settings} label="Settings" hint="G S" onSelect={() => run(() => navigate("/settings"))} />
              <PaletteItem icon={LogOut} label="Sign out" onSelect={() => run(() => navigate("/login"))} />
            </Command.Group>

            <Command.Group heading="Help">
              <PaletteItem
                icon={Keyboard}
                label="Keyboard shortcuts"
                hint="?"
                onSelect={() => run(() => emitOpenHelp())}
              />
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between px-3 py-2 border-t border-stone-100 bg-stone-50/60">
            <div className="flex items-center gap-3 font-mono text-[10px] text-stone-400 tracking-wider">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>esc close</span>
            </div>
            <span className="font-mono text-[10px] text-stone-400 tracking-wider">COLLABSPHERE</span>
          </div>
        </Command>
      </div>
    </div>
  );
};

interface PaletteItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onSelect: () => void;
}

const PaletteItem = ({ icon: Icon, label, hint, onSelect }: PaletteItemProps) => (
  <Command.Item
    onSelect={onSelect}
    className="mx-2 my-0.5 flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer text-sm text-stone-700
      data-[selected=true]:bg-teal-50 data-[selected=true]:text-teal-800
      transition-colors"
  >
    <Icon className="h-4 w-4 text-stone-400" />
    <span className="flex-1 truncate">{label}</span>
    {hint && <span className="font-mono text-[10px] text-stone-400 tracking-wider">{hint}</span>}
  </Command.Item>
);
