import type { ReactNode } from "react";

import { SettingsNav } from "../../../components/settings/settings-nav";

export default function SettingsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
            Account settings
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">Settings</h1>
          <p className="mt-2 text-sm text-stone-500">
            Account-level preferences and profile settings for the authenticated app.
          </p>
        </div>
        <SettingsNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
