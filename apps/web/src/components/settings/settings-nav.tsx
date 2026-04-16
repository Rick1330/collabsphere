"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@collabsphere/ui/lib/utils";

const items = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/appearance", label: "Appearance" },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings navigation" className="overflow-x-auto">
      <div className="flex gap-2 md:grid md:gap-1">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition md:rounded-xl",
                active
                  ? "border-teal-200 bg-teal-50 text-teal-700"
                  : "border-stone-200 bg-white text-stone-500 hover:text-stone-900",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

