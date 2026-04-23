import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NotificationIcon } from "./notification-icon";
import type { NotificationType } from "@/api/adapters/notifications";

// Each notification type maps to a distinct (icon, tone) pair. This guards
// against a regression where adding a new NotificationType silently falls
// through to the default Bell icon, which is technically valid but visually
// indistinguishable from "unknown event".
describe("NotificationIcon", () => {
  // [type, expected accent class fragment, expected bg class fragment]
  const cases: Array<[NotificationType, string, string]> = [
    ["task.assigned", "text-teal-600", "bg-teal-50"],
    ["task.completed", "text-teal-600", "bg-teal-50"],
    ["task.status_changed", "text-teal-600", "bg-teal-50"],
    ["document.mention", "text-sky-600", "bg-sky-50"],
    ["document.submitted", "text-sky-600", "bg-sky-50"],
    ["document.approved", "text-sky-600", "bg-sky-50"],
    ["comment.reply", "text-stone-500", "bg-stone-100"],
    ["workspace.member_joined", "text-emerald-600", "bg-emerald-50"],
    ["workspace.invitation", "text-emerald-600", "bg-emerald-50"],
    ["deadline.reminder", "text-amber-600", "bg-amber-50"],
  ];

  for (const [type, iconClass, bgClass] of cases) {
    it(`renders the ${type} branch with its tone palette`, () => {
      const { container } = render(<NotificationIcon type={type} />);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper).not.toBeNull();
      expect(wrapper.className).toMatch(new RegExp(bgClass));
      const icon = wrapper.querySelector("svg");
      expect(icon).not.toBeNull();
      expect(icon!.getAttribute("class") ?? "").toMatch(new RegExp(iconClass));
    });
  }

  it("falls back to the neutral Bell tone for unknown types", () => {
    const { container } = render(<NotificationIcon type="totally.fake.type" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toMatch(/bg-stone-100/);
    expect(wrapper.querySelector("svg")).not.toBeNull();
  });
});
