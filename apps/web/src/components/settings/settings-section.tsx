import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SettingsSection({
  children,
  description,
  title,
}: Readonly<SettingsSectionProps>) {
  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-stone-500">{description}</p> : null}
      </div>
      <div className="mt-4 border-t border-stone-100 pt-4">{children}</div>
    </section>
  );
}

