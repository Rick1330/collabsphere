import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  ShieldOff,
  UserPlus,
} from "lucide-react";
import { lookupInvitation, type Invitation } from "@/lib/mock-invitations";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Toggle this to test the unauthenticated branch.
const MOCK_AUTH_USER: { fullName: string; email: string } | null = {
  fullName: "Elshaday Tesfaye",
  email: "jane@collabsphere.app",
};

const ROLE_COPY: Record<Invitation["role"], { label: string; blurb: string }> = {
  viewer: {
    label: "Viewer",
    blurb: "Read-only access to documents, tasks, and activity. Cannot edit or comment.",
  },
  member: {
    label: "Member",
    blurb: "Create and edit documents, work on tasks, and collaborate with the team.",
  },
  manager: {
    label: "Manager",
    blurb: "Full member access plus manage members, settings, and approve work.",
  },
  supervisor: {
    label: "Supervisor",
    blurb: "Review submissions, approve work, and oversee the academic workflow.",
  },
};

const TYPE_TONE: Record<Invitation["workspace"]["type"], string> = {
  professional: "text-cs-teal-bright border-[rgba(20,184,166,0.3)] bg-[rgba(20,184,166,0.08)]",
  academic: "text-amber-300 border-amber-400/30 bg-amber-500/10",
  general: "text-slate-300 border-slate-500/30 bg-slate-500/10",
};

function getInviteState(
  invite: Invitation | null,
): "invalid" | "expired" | "used" | "email_mismatch" | "pending" {
  if (!invite) return "invalid";
  return invite.status;
}

const AcceptInvite = () => {
  const { token = "" } = useParams<{ token: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<Invitation | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Allow ?as=unauth to demo the unauthenticated branch.
  const forceUnauth = params.get("as") === "unauth";
  const user = forceUnauth ? null : MOCK_AUTH_USER;

  useEffect(() => {
    document.title = "Workspace invitation — CollabSphere";
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setInvite(null);
    const t = setTimeout(() => {
      if (!alive) return;
      const result = lookupInvitation(token);
      setInvite(result);
      setLoading(false);
    }, 320);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [token]);

  const expiresIn = useMemo(() => {
    if (!invite) return null;
    const ms = new Date(invite.expiresAt).getTime() - Date.now();
    if (ms <= 0) return "expired";
    const days = Math.round(ms / (24 * 60 * 60 * 1000));
    if (days <= 1) return "expires in 1 day";
    return `expires in ${days} days`;
  }, [invite]);

  const handleAccept = async () => {
    if (!invite) return;
    setAcceptError(null);
    setAccepting(true);
    await new Promise((r) => setTimeout(r, 700));
    setAccepting(false);
    toast.success(`Welcome to ${invite.workspace.name}`);
    navigate(`/w/${invite.workspace.id}`);
  };

  const inviteState = loading ? "loading" : getInviteState(invite);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
      style={{ background: "var(--cs-base)" }}
    >
      {/* Background atmosphere — matches AuthLayout language */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="invite-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="0.75" fill="rgba(20,184,166,0.04)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#invite-grid)" />
        </svg>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 1000px 700px at 50% 30%, rgba(20,184,166,0.06), transparent 70%)",
          }}
        />
      </div>

      {/* Brand */}
      <div className="relative z-10 mb-8 mt-10">
        <Link
          to="/"
          className="text-base font-bold tracking-tight transition-colors duration-150 hover:text-cs-teal-bright"
          style={{ color: "var(--cs-text-headline)" }}
        >
          CollabSphere
        </Link>
      </div>

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-[560px]"
        initial={reduced ? false : { opacity: 0, filter: "blur(8px)", y: 14 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div
          className="rounded-2xl backdrop-blur-xl overflow-hidden"
          style={{
            background: "rgba(10,26,26,0.82)",
            border: "1px solid rgba(20,184,166,0.18)",
            boxShadow: "0 0 80px rgba(20,184,166,0.05)",
          }}
        >
          <span className="block font-mono-cs text-[10px] tracking-[0.22em] uppercase px-7 pt-7 text-[rgba(45,212,191,0.6)]">
            Workspace Invitation
          </span>

          <div className="px-7 pb-7 pt-3">
            {inviteState === "loading" ? (
              <LoadingState />
            ) : inviteState === "invalid" ? (
              <InvalidState />
            ) : inviteState === "expired" ? (
              <ExpiredState invite={invite} />
            ) : inviteState === "used" ? (
              <UsedState invite={invite} />
            ) : inviteState === "email_mismatch" ? (
              <EmailMismatchState invite={invite} viewerEmail={user?.email ?? null} />
            ) : (
              <PendingState
                invite={invite}
                user={user}
                expiresIn={expiresIn}
                accepting={accepting}
                acceptError={acceptError}
                onAccept={handleAccept}
              />
            )}
          </div>
        </div>

        {/* Demo state switcher — small, faint */}
        <div className="mt-6 text-center">
          <p className="font-mono-cs text-[10px] tracking-[0.18em] uppercase text-[var(--cs-text-faint)] mb-2">
            Demo states
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
            {[
              ["demo-pending", "pending"],
              ["demo-expired", "expired"],
              ["demo-used", "used"],
              ["demo-mismatch", "email mismatch"],
              ["invalid", "invalid"],
            ].map(([t, label]) => (
              <Link
                key={t}
                to={`/invite/${t}`}
                className={cn(
                  "px-2 py-1 rounded-md border font-mono-cs transition-colors",
                  token === t
                    ? "border-[rgba(20,184,166,0.4)] text-cs-teal-bright bg-[rgba(20,184,166,0.08)]"
                    : "border-[rgba(20,184,166,0.12)] text-[var(--cs-text-muted)] hover:text-[var(--cs-text-body)] hover:border-[rgba(20,184,166,0.25)]",
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AcceptInvite;

/* ─────────── States ─────────── */

const LoadingState = () => (
  <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
    <Loader2 className="h-5 w-5 animate-spin text-cs-teal-bright" />
    <p className="text-sm text-[var(--cs-text-body)]">Looking up your invitation…</p>
  </div>
);

const InvalidState = () => (
  <div className="py-4">
    <Header
      icon={<ShieldOff className="h-5 w-5 text-[var(--cs-red)]" />}
      tone="bad"
      title="This invitation isn't valid"
      sub="The link looks malformed, or it was revoked. Ask the workspace owner to send you a new one."
    />
    <div className="mt-6 flex flex-col sm:flex-row gap-3">
      <Link
        to="/login"
        className="cs-btn-secondary px-4 py-2.5 text-[13px] inline-flex items-center justify-center gap-2 flex-1"
      >
        Sign in
      </Link>
      <Link
        to="/dashboard"
        className="cs-btn-primary px-4 py-2.5 text-[13px] inline-flex items-center justify-center gap-2 flex-1"
      >
        Go to dashboard
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </div>
);

const ExpiredState = ({ invite }: { invite: Invitation }) => (
  <div className="py-4">
    <WorkspaceBlock invite={invite} dim />
    <Header
      icon={<Clock className="h-5 w-5 text-amber-400" />}
      tone="warn"
      title="This invitation has expired"
      sub={`It expired ${relativeTime(invite.expiresAt)} ago. Ask ${invite.invitedBy.fullName} to send you a fresh link.`}
    />
    <div className="mt-6">
      <a
        href={`mailto:${invite.invitedBy.email}?subject=Re-send%20workspace%20invite`}
        className="cs-btn-secondary px-4 py-2.5 text-[13px] inline-flex items-center justify-center gap-2 w-full"
      >
        Email {invite.invitedBy.fullName.split(" ")[0]} for a new link
      </a>
    </div>
  </div>
);

const UsedState = ({ invite }: { invite: Invitation }) => (
  <div className="py-4">
    <WorkspaceBlock invite={invite} dim />
    <Header
      icon={<CheckCircle2 className="h-5 w-5 text-cs-teal-bright" />}
      tone="ok"
      title="You've already joined this workspace"
      sub={`This invitation was accepted. Head to ${invite.workspace.name} to keep working.`}
    />
    <Link
      to={`/w/${invite.workspace.id}`}
      className="cs-btn-primary mt-6 px-4 py-2.5 text-[13px] inline-flex items-center justify-center gap-2 w-full"
    >
      Open {invite.workspace.name}
      <ArrowRight className="h-4 w-4" />
    </Link>
  </div>
);

const EmailMismatchState = ({
  invite,
  viewerEmail,
}: {
  invite: Invitation;
  viewerEmail: string | null;
}) => (
  <div className="py-4">
    <WorkspaceBlock invite={invite} />
    <Header
      icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
      tone="warn"
      title="This invite was sent to a different address"
      sub={
        <>
          The invitation is for{" "}
          <span className="font-mono-cs text-[var(--cs-text-headline)]">{invite.email}</span>.
          {viewerEmail ? (
            <>
              {" "}
              You're signed in as{" "}
              <span className="font-mono-cs text-[var(--cs-text-headline)]">{viewerEmail}</span>.
              Sign in with the invited address to accept.
            </>
          ) : (
            <> Sign in with that address to accept it.</>
          )}
        </>
      }
    />
    <div className="mt-6 flex flex-col sm:flex-row gap-3">
      <Link
        to="/login"
        className="cs-btn-secondary px-4 py-2.5 text-[13px] inline-flex items-center justify-center gap-2 flex-1"
      >
        Switch account
      </Link>
      <Link
        to="/dashboard"
        className="cs-btn-primary px-4 py-2.5 text-[13px] inline-flex items-center justify-center gap-2 flex-1"
      >
        Cancel
      </Link>
    </div>
  </div>
);

const PendingState = ({
  invite,
  user,
  expiresIn,
  accepting,
  acceptError,
  onAccept,
}: {
  invite: Invitation;
  user: { fullName: string; email: string } | null;
  expiresIn: string | null;
  accepting: boolean;
  acceptError: string | null;
  onAccept: () => void;
}) => {
  const role = ROLE_COPY[invite.role];
  return (
    <div>
      <WorkspaceBlock invite={invite} />

      {/* Role + expiry */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-[rgba(20,184,166,0.14)] bg-[rgba(20,184,166,0.04)] p-4">
          <div className="font-mono-cs text-[10px] tracking-[0.18em] uppercase text-[var(--cs-text-faint)]">
            Role assigned
          </div>
          <div className="mt-1.5 text-[15px] font-semibold text-[var(--cs-text-headline)]">
            {role.label}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--cs-text-muted)]">
            {role.blurb}
          </p>
        </div>
        <div className="rounded-lg border border-[rgba(20,184,166,0.14)] bg-[rgba(20,184,166,0.04)] p-4">
          <div className="font-mono-cs text-[10px] tracking-[0.18em] uppercase text-[var(--cs-text-faint)]">
            Invitation
          </div>
          <div className="mt-1.5 text-[13px] text-[var(--cs-text-body)] flex items-center gap-2">
            <UserPlus className="h-3.5 w-3.5 text-cs-teal-bright" />
            From <span className="text-[var(--cs-text-headline)] font-medium">{invite.invitedBy.fullName}</span>
          </div>
          <div className="mt-2 text-[12px] text-[var(--cs-text-muted)] flex items-center gap-2">
            <CalendarClock className="h-3.5 w-3.5" />
            {expiresIn}
          </div>
        </div>
      </div>

      {acceptError && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[12px] text-red-300 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          {acceptError}
        </div>
      )}

      {/* CTA depends on auth */}
      {user ? (
        <div className="mt-6">
          <p className="text-[12px] text-[var(--cs-text-muted)] mb-3">
            Signed in as{" "}
            <span className="text-[var(--cs-text-headline)] font-medium">{user.email}</span>.
          </p>
          <button
            type="button"
            onClick={onAccept}
            disabled={accepting}
            className="cs-btn-primary cs-focus px-4 py-3 text-[14px] w-full inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Accept and join {invite.workspace.name}
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-2.5">
          <Link
            to={`/register?next=/invite/${invite.token}`}
            className="cs-btn-primary cs-focus px-4 py-3 text-[14px] w-full inline-flex items-center justify-center gap-2"
          >
            Create account to join
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to={`/login?next=/invite/${invite.token}`}
            className="cs-btn-secondary cs-focus px-4 py-3 text-[13px] w-full inline-flex items-center justify-center gap-2"
          >
            Sign in to existing account
          </Link>
          <button
            type="button"
            onClick={() => toast.info("Google sign-in is not wired in this demo.")}
            className="cs-btn-secondary cs-focus px-4 py-3 text-[13px] w-full inline-flex items-center justify-center gap-2"
          >
            Continue with Google
          </button>
          <p className="text-center text-[11px] text-[var(--cs-text-faint)] pt-1">
            We'll bring you back here to finish accepting.
          </p>
        </div>
      )}
    </div>
  );
};

/* ─────────── Building blocks ─────────── */

const Header = ({
  icon,
  title,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  sub: React.ReactNode;
  tone: "ok" | "warn" | "bad" | "neutral";
}) => (
  <div className="flex items-start gap-3">
    <div
      className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 border",
        tone === "ok" && "bg-[rgba(20,184,166,0.08)] border-[rgba(20,184,166,0.25)]",
        tone === "warn" && "bg-amber-500/10 border-amber-400/25",
        tone === "bad" && "bg-red-500/10 border-red-500/25",
        tone === "neutral" && "bg-[rgba(20,184,166,0.04)] border-[rgba(20,184,166,0.15)]",
      )}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <h1 className="text-[20px] font-semibold tracking-tight text-[var(--cs-text-headline)] leading-tight">
        {title}
      </h1>
      <p className="text-[13px] text-[var(--cs-text-muted)] mt-1.5 leading-relaxed">{sub}</p>
    </div>
  </div>
);

const WorkspaceBlock = ({ invite, dim = false }: { invite: Invitation; dim?: boolean }) => (
  <div
    className={cn(
      "flex items-start gap-4 p-4 rounded-xl border",
      "border-[rgba(20,184,166,0.15)] bg-[rgba(13,148,136,0.05)]",
      dim && "opacity-60",
    )}
  >
    <div
      className="h-12 w-12 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
      style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)" }}
      aria-hidden="true"
    >
      {invite.workspace.icon}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-[16px] font-semibold text-[var(--cs-text-headline)] truncate">
          {invite.workspace.name}
        </h2>
        <span
          className={cn(
            "font-mono-cs text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5 rounded border",
            TYPE_TONE[invite.workspace.type],
          )}
        >
          {invite.workspace.type}
        </span>
      </div>
      <p className="text-[12.5px] text-[var(--cs-text-muted)] mt-1 line-clamp-2">
        {invite.workspace.description}
      </p>
      <p className="text-[11px] text-[var(--cs-text-faint)] mt-1.5 font-mono-cs tracking-wider">
        {invite.workspace.memberCount} {invite.workspace.memberCount === 1 ? "member" : "members"}
      </p>
    </div>
  </div>
);
