import Link from "next/link";
import * as React from "react";

type TopNavBarProps = {
  workspaceSwitcher: React.ReactNode;
  userMenu: React.ReactNode;
};

type TopNavPlaceholderControlProps = {
  accentLabel: string;
  ariaLabel: string;
  description: string;
  label: string;
  shortcut?: readonly string[];
  tag: string;
  type?: "button" | "search";
};

function TopNavPlaceholderControl({
  accentLabel,
  ariaLabel,
  description,
  label,
  shortcut,
  tag,
  type = "button",
}: TopNavPlaceholderControlProps) {
  const content = (
    <>
      <span className="top-nav__control-mark" aria-hidden="true">
        {accentLabel}
      </span>
      <span className="top-nav__control-copy">
        <span className="top-nav__control-label">{label}</span>
        <span className="top-nav__control-description">{description}</span>
      </span>
      {shortcut ? (
        <span className="top-nav__shortcut" aria-hidden="true">
          {shortcut.map((key) => (
            <kbd key={key}>{key}</kbd>
          ))}
        </span>
      ) : (
        <span className="top-nav__control-tag">{tag}</span>
      )}
    </>
  );

  if (type === "search") {
    return (
      <div className="top-nav__search" role="search">
        <button
          type="button"
          className="top-nav__search-trigger"
          aria-label={ariaLabel}
          aria-disabled="true"
          disabled
        >
          {content}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="top-nav__control"
      aria-label={ariaLabel}
      aria-disabled="true"
      disabled
    >
      {content}
    </button>
  );
}

export function TopNavBar({ workspaceSwitcher, userMenu }: TopNavBarProps) {
  return (
    <nav className="top-nav" aria-label="Authenticated top navigation">
      <div className="top-nav__brand-cluster">
        <Link className="top-nav__brand" href="/dashboard">
          <span className="top-nav__brand-mark" aria-hidden="true">
            CS
          </span>
          <span className="top-nav__brand-copy">
            <span className="top-nav__brand-label">CollabSphere</span>
            <span className="top-nav__brand-meta">Workspace command center</span>
          </span>
        </Link>
        <p className="top-nav__context-note">
          Authenticated global shell with collaboration controls staged in place.
        </p>
      </div>

      <div className="top-nav__workspace-slot" role="group" aria-label="Workspace controls">
        {workspaceSwitcher}
      </div>

      <TopNavPlaceholderControl
        accentLabel="SR"
        ariaLabel="Search placeholder. Search and command palette wiring are not implemented in this story."
        description="Search workspaces, documents, and commands"
        label="Search the collaboration graph"
        shortcut={["Ctrl", "K"]}
        tag="Soon"
        type="search"
      />

      <div className="top-nav__actions" role="group" aria-label="Notification and account controls">
        <TopNavPlaceholderControl
          accentLabel="NT"
          ariaLabel="Notifications placeholder. Notification data is not implemented in this story."
          description="Notification center staged for later data wiring"
          label="Notifications"
          tag="Feed soon"
        />
        <div className="top-nav__user-slot">{userMenu}</div>
      </div>
    </nav>
  );
}
