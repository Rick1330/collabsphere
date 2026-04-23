import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SettingsSection } from "./settings-section";
import { ToggleSwitch } from "./toggle-switch";
import {
  fetchNotificationPreferences,
  NOTIFICATION_TYPES,
  type NotificationPreferences,
  updateNotificationPreferences,
} from "@/api/adapters/notifications";

const PREFS_KEY = ["notification-preferences"] as const;

export const NotificationPrefs = () => {
  const queryClient = useQueryClient();

  const { data: prefs, isLoading, refetch } = useQuery({
    queryKey: PREFS_KEY,
    queryFn: fetchNotificationPreferences,
  });

  const mutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onError: () => {
      refetch();
      toast.error("Failed to update preference.");
    },
  });

  const applyPatch = (patch: (p: NotificationPreferences) => NotificationPreferences) => {
    const current = queryClient.getQueryData<NotificationPreferences>(PREFS_KEY);
    if (!current) return;
    const next = patch(current);
    queryClient.setQueryData(PREFS_KEY, next);
    mutation.mutate(next);
  };

  const handleToggle = (channel: "inApp" | "email", typeKey: string, checked: boolean) => {
    applyPatch((p) => ({ ...p, [channel]: { ...p[channel], [typeKey]: checked } }));
  };

  const handleDigestToggle = (key: "dailyDigestEnabled" | "weeklyDigestEnabled", checked: boolean) => {
    applyPatch((p) => ({ ...p, [key]: checked }));
  };

  return (
    <SettingsSection
      title="Notification preferences"
      description="Choose how you'd like to be notified about activity."
    >
      {isLoading || !prefs ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="h-4 w-48 rounded bg-stone-100" />
              <div className="flex gap-6">
                <div className="h-5 w-9 rounded-full bg-stone-100" />
                <div className="h-5 w-9 rounded-full bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Toggle table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left font-mono text-[10px] tracking-[0.1em] text-stone-400 uppercase pb-2.5 pr-4">
                    Notification type
                  </th>
                  <th className="text-center font-mono text-[10px] tracking-[0.1em] text-stone-400 uppercase pb-2.5 px-2 w-20">
                    In-app
                  </th>
                  <th className="text-center font-mono text-[10px] tracking-[0.1em] text-stone-400 uppercase pb-2.5 px-2 w-20">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody>
                {NOTIFICATION_TYPES.map((type) => (
                  <tr
                    key={type.key}
                    className={type === NOTIFICATION_TYPES[NOTIFICATION_TYPES.length - 1] ? "" : "border-b border-stone-100"}
                  >
                    <td className="py-3 pr-4 text-sm text-stone-700">{type.label}</td>
                    <td className="py-3 px-2 text-center">
                      <div className="inline-flex">
                        <ToggleSwitch
                          checked={!!prefs.inApp[type.key]}
                          onChange={(c) => handleToggle("inApp", type.key, c)}
                          aria-label={`${type.label} in-app notifications`}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="inline-flex">
                        <ToggleSwitch
                          checked={!!prefs.email[type.key]}
                          onChange={(c) => handleToggle("email", type.key, c)}
                          aria-label={`${type.label} email notifications`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Digests */}
          <div>
            <h3 className="font-mono text-[10px] tracking-[0.1em] text-stone-400 uppercase mb-3">
              Email digests
            </h3>
            <div className="space-y-2">
              <DigestRow
                title="Daily digest"
                description="Receive a summary of activity every morning"
                checked={prefs.dailyDigestEnabled}
                onChange={(c) => handleDigestToggle("dailyDigestEnabled", c)}
                ariaLabel="Daily digest emails"
              />
              <DigestRow
                title="Weekly digest"
                description="Receive a weekly summary every Monday"
                checked={prefs.weeklyDigestEnabled}
                onChange={(c) => handleDigestToggle("weeklyDigestEnabled", c)}
                ariaLabel="Weekly digest emails"
              />
            </div>
          </div>
        </div>
      )}
    </SettingsSection>
  );
};

interface DigestRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (c: boolean) => void;
  ariaLabel: string;
}

const DigestRow = ({ title, description, checked, onChange, ariaLabel }: DigestRowProps) => (
  <div className="group flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-stone-200 bg-white hover:border-stone-300 transition-colors">
    <div className="min-w-0">
      <p className="text-sm font-medium text-stone-900 group-hover:text-teal-700 transition-colors">{title}</p>
      <p className="mt-0.5 text-[13px] text-stone-500">{description}</p>
    </div>
    <ToggleSwitch checked={checked} onChange={onChange} aria-label={ariaLabel} />
  </div>
);
