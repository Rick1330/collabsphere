import { describe, it, expect } from "vitest";
import {
  fetchMembers,
  fetchPendingInvitations,
  getAssignableRoles,
  getRoleLabel,
  inviteMember,
  revokeInvitation,
  sortMembers,
  type WorkspaceMember,
  type WorkspaceRole,
} from "./members";

const mkMember = (
  membershipId: string,
  fullName: string,
  role: WorkspaceRole,
): WorkspaceMember => ({
  membershipId,
  user: { id: membershipId, fullName, email: `${membershipId}@x.dev`, avatarUrl: null },
  role,
  roleLabel: getRoleLabel(role),
  joinedAt: new Date().toISOString(),
  lastAccessedAt: null,
});

describe("api/adapters/members", () => {
  it("getAssignableRoles enforces the documented role policy", () => {
    // Owner can promote up to Admin but cannot mint another Owner here.
    expect(getAssignableRoles("OWNER")).toEqual(["ADMIN", "MANAGER", "MEMBER", "VIEWER"]);
    // Admin cannot create another Admin or an Owner.
    expect(getAssignableRoles("ADMIN")).toEqual(["MANAGER", "MEMBER", "VIEWER"]);
    // Lower roles cannot reassign at all.
    expect(getAssignableRoles("MANAGER")).toEqual([]);
    expect(getAssignableRoles("MEMBER")).toEqual([]);
    expect(getAssignableRoles("VIEWER")).toEqual([]);
  });

  it("sortMembers orders by role rank then by name (locale-aware)", () => {
    const sorted = sortMembers([
      mkMember("m4", "Bethel", "MEMBER"),
      mkMember("m1", "Yonas", "OWNER"),
      mkMember("m3", "Eyob", "MANAGER"),
      mkMember("m2", "Hiwot", "ADMIN"),
      mkMember("m5", "Aaron", "MEMBER"),
    ]);
    expect(sorted.map((m) => m.user.fullName)).toEqual([
      "Yonas", // OWNER
      "Hiwot", // ADMIN
      "Eyob", // MANAGER
      "Aaron", // MEMBER, alphabetical
      "Bethel", // MEMBER, alphabetical
    ]);
  });

  it("fetchMembers returns an Owner for any workspace id (auto-seeds)", async () => {
    const res = await fetchMembers("brand-new-ws");
    expect(res.data.items.length).toBeGreaterThan(0);
    expect(res.data.items.some((m) => m.role === "OWNER")).toBe(true);
  });

  it("inviteMember + fetchPendingInvitations + revokeInvitation round-trip", async () => {
    const ws = `test-ws-${Date.now()}`;
    await inviteMember(ws, { email: "new.user@example.com", role: "MEMBER" });
    const pending = await fetchPendingInvitations(ws);
    const inv = pending.data.items.find((i) => i.email === "new.user@example.com");
    expect(inv).toBeDefined();
    expect(inv!.role).toBe("MEMBER");

    await revokeInvitation(ws, inv!.id);
    const after = await fetchPendingInvitations(ws);
    expect(after.data.items.find((i) => i.id === inv!.id)).toBeUndefined();
  });

  it("inviteMember rejects an email that is already a workspace member", async () => {
    const ws = `test-ws-dup-${Date.now()}`;
    // Auto-seeded workspace puts Elshaday Tesfaye as Owner with this email.
    await expect(
      inviteMember(ws, { email: "jane@collabsphere.app", role: "MEMBER" }),
    ).rejects.toThrow(/already a member/i);
  });
});
