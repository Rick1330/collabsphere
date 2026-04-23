import { useEffect } from "react";
import { Database, GitCommitHorizontal, Globe, Server, ShieldCheck } from "lucide-react";
import { AdminPageHeader, AdminSection, SeverityChip } from "./admin-primitives";

const SYSTEM_INFO = {
  apiVersion: "v1.4.2",
  buildCommit: "a3f29b1",
  uptimeDays: 18,
  environment: "production",
  region: "us-east-1",
  databaseStatus: "healthy",
  storageProvider: "S3-compatible",
  nodeRuntime: "v20.11.0",
  buildDate: "2025-04-12T09:42:00Z",
};

const READ_ONLY_DEFAULTS = [
  { key: "MAX_WORKSPACES_PER_USER", value: "10", desc: "Per-account workspace cap" },
  { key: "MAX_MEMBERS_PER_WORKSPACE", value: "50", desc: "Including owner and pending invites" },
  { key: "MAX_DOCUMENT_SIZE_MB", value: "10", desc: "Single document upper bound" },
  { key: "MAX_AVATAR_SIZE_MB", value: "2", desc: "Profile avatar upload limit" },
  { key: "INVITATION_TTL_DAYS", value: "7", desc: "How long invites stay valid" },
  { key: "PASSWORD_RESET_TTL_HOURS", value: "1", desc: "Reset link validity window" },
  { key: "AUDIT_RETENTION_DAYS", value: "365", desc: "Audit log hot-storage horizon" },
  { key: "SESSION_TTL_HOURS", value: "168", desc: "Idle session expiry (7 days)" },
];

export const AdminSettings = () => {
  useEffect(() => {
    document.title = "System Settings — Admin — CollabSphere";
  }, []);

  return (
    <div>
      <AdminPageHeader
        eyebrow="OPERATIONS · SYSTEM"
        title="System configuration"
        description="Read-only platform configuration and runtime info. Values are baked at deploy time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminSection
          title="Runtime"
          description="Build, environment, and region metadata."
        >
          <dl className="divide-y divide-stone-100">
            <KvRow icon={GitCommitHorizontal} label="API version" value={SYSTEM_INFO.apiVersion} mono />
            <KvRow icon={GitCommitHorizontal} label="Build commit" value={SYSTEM_INFO.buildCommit} mono />
            <KvRow
              icon={Server}
              label="Build date"
              value={new Date(SYSTEM_INFO.buildDate).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
            <KvRow icon={Server} label="Uptime" value={`${SYSTEM_INFO.uptimeDays} days`} />
            <KvRow icon={Server} label="Node runtime" value={SYSTEM_INFO.nodeRuntime} mono />
            <KvRow
              icon={Globe}
              label="Environment"
              value={
                <SeverityChip tone={SYSTEM_INFO.environment === "production" ? "success" : "warn"} dot>
                  {SYSTEM_INFO.environment}
                </SeverityChip>
              }
            />
            <KvRow icon={Globe} label="Region" value={SYSTEM_INFO.region} mono />
          </dl>
        </AdminSection>

        <AdminSection title="Services" description="Backing services and storage status.">
          <dl className="divide-y divide-stone-100">
            <KvRow
              icon={Database}
              label="Database"
              value={
                <SeverityChip tone="success" dot>
                  {SYSTEM_INFO.databaseStatus}
                </SeverityChip>
              }
            />
            <KvRow icon={Database} label="Storage" value={SYSTEM_INFO.storageProvider} />
            <KvRow
              icon={ShieldCheck}
              label="Audit pipeline"
              value={
                <SeverityChip tone="success" dot>
                  active
                </SeverityChip>
              }
            />
            <KvRow
              icon={ShieldCheck}
              label="Email delivery"
              value={
                <SeverityChip tone="success" dot>
                  healthy
                </SeverityChip>
              }
            />
          </dl>
        </AdminSection>
      </div>

      <div className="mt-4">
        <AdminSection
          title="Platform limits"
          description="Quotas and TTLs configured at deploy time. Changing requires a redeploy."
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60">
                  <th className="text-left h-8 px-3 font-mono text-[10px] tracking-[0.14em] uppercase text-stone-500 font-semibold">
                    Key
                  </th>
                  <th className="text-left h-8 px-3 font-mono text-[10px] tracking-[0.14em] uppercase text-stone-500 font-semibold">
                    Description
                  </th>
                  <th className="text-right h-8 px-3 font-mono text-[10px] tracking-[0.14em] uppercase text-stone-500 font-semibold">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {READ_ONLY_DEFAULTS.map((item) => (
                  <tr
                    key={item.key}
                    className="border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-stone-50/40"
                  >
                    <td className="px-3 py-2 font-mono text-[11px] text-stone-700">
                      {item.key}
                    </td>
                    <td className="px-3 py-2 text-[12px] text-stone-500">
                      {item.desc}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[12px] text-stone-900 tabular-nums font-semibold">
                      {item.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 bg-stone-50/60 border-t border-stone-100">
            <p className="font-mono text-[10px] text-stone-400 tracking-wider">
              READ-ONLY · CONFIGURED AT DEPLOY TIME
            </p>
          </div>
        </AdminSection>
      </div>
    </div>
  );
};

const KvRow = ({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) => (
  <div className="flex items-center justify-between px-4 py-2.5 gap-4">
    <div className="flex items-center gap-2 text-[12px] text-stone-600">
      <Icon className="h-3.5 w-3.5 text-stone-400" />
      {label}
    </div>
    <div
      className={
        mono
          ? "font-mono text-[11px] text-stone-900"
          : "text-[12px] text-stone-900"
      }
    >
      {value}
    </div>
  </div>
);
