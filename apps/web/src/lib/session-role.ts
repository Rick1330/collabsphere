/**
 * Effective session role derivation.
 *
 * The signed-in `MockAccount` carries a `globalRole` (USER / ADMIN) and a
 * `defaultWorkspaceRole` from the persona-scenario role vocabulary. The
 * dashboard, top nav, and review surfaces all need to answer the same
 * question:  "Which role-specific UI should this account see?"
 *
 * Rather than scattering ad-hoc checks like
 *   `account.globalRole === "ADMIN" || account.defaultWorkspaceRole === ...`
 * across components, this module collapses that decision to a single
 * `EffectiveRole` discriminator + a few helpers.
 *
 * Mapping:
 *   - globalRole === ADMIN          → "admin"           (platform admin)
 *   - workspaceRole SUPERVISOR      → "supervisor"      (review queue)
 *   - workspaceRole MANAGER (academic context) → "supervisor"
 *   - workspaceRole STUDENT         → "student"
 *   - workspaceRole VIEWER          → "viewer"          (read-only)
 *   - workspaceRole OWNER/ADMIN     → "owner"           (workspace owner / tech lead)
 *   - workspaceRole MANAGER (other) → "manager"
 *   - everything else               → "member"
 *
 * The `canReview` flag is the gating signal for the review queue / supervisor
 * panels — admins, owners, supervisors and managers can approve work.
 */

import type { MockAccount } from "@/lib/mock-accounts";

export type EffectiveRole =
  | "admin"
  | "owner"
  | "supervisor"
  | "manager"
  | "student"
  | "viewer"
  | "member";

export interface SessionRole {
  role: EffectiveRole;
  /** True when this account can approve / request changes on submissions. */
  canReview: boolean;
  /** True for the read-only viewer/stakeholder/auditor persona. */
  isReadOnly: boolean;
  /** True for platform admins. */
  isPlatformAdmin: boolean;
  /** Human-friendly label shown on dashboard banners. */
  label: string;
}

export function getSessionRole(account: MockAccount | null): SessionRole {
  if (!account) {
    return {
      role: "member",
      canReview: false,
      isReadOnly: false,
      isPlatformAdmin: false,
      label: "Guest",
    };
  }

  if (account.globalRole === "ADMIN") {
    return {
      role: "admin",
      canReview: true,
      isReadOnly: false,
      isPlatformAdmin: true,
      label: "Platform admin",
    };
  }

  const ws = account.defaultWorkspaceRole;
  const isAcademic = account.defaultWorkspaceType === "academic";

  if (ws === "SUPERVISOR" || (ws === "MANAGER" && isAcademic)) {
    return {
      role: "supervisor",
      canReview: true,
      isReadOnly: false,
      isPlatformAdmin: false,
      label: isAcademic ? "Advisor" : "Reviewer",
    };
  }

  if (ws === "STUDENT") {
    return {
      role: "student",
      canReview: false,
      isReadOnly: false,
      isPlatformAdmin: false,
      label: "Student",
    };
  }

  if (ws === "VIEWER") {
    return {
      role: "viewer",
      canReview: false,
      isReadOnly: true,
      isPlatformAdmin: false,
      label: "Stakeholder",
    };
  }

  if (ws === "OWNER" || ws === "ADMIN") {
    return {
      role: "owner",
      canReview: true,
      isReadOnly: false,
      isPlatformAdmin: false,
      label: ws === "OWNER" ? "Workspace owner" : "Tech lead",
    };
  }

  if (ws === "MANAGER") {
    return {
      role: "manager",
      canReview: true,
      isReadOnly: false,
      isPlatformAdmin: false,
      label: "Project manager",
    };
  }

  return {
    role: "member",
    canReview: false,
    isReadOnly: false,
    isPlatformAdmin: false,
    label: "Member",
  };
}
