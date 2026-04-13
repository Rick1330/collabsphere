import * as React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

type MockMediaQueryList = {
  matches: boolean;
  media: string;
  onchange: null;
  addEventListener: (type: "change", listener: (event: MediaQueryListEvent) => void) => void;
  removeEventListener: (type: "change", listener: (event: MediaQueryListEvent) => void) => void;
  addListener: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener: (listener: (event: MediaQueryListEvent) => void) => void;
  dispatchEvent: () => boolean;
};

const mediaQueryListeners = new Map<string, Set<(event: MediaQueryListEvent) => void>>();

const getMediaQueryMatches = (query: string) => {
  if (query === "(max-width: 767px)") {
    return window.innerWidth <= 767;
  }

  if (query === "(prefers-color-scheme: dark)") {
    return false;
  }

  return false;
};

const createMatchMedia = (query: string): MockMediaQueryList => {
  const listeners = mediaQueryListeners.get(query) ?? new Set<(event: MediaQueryListEvent) => void>();
  mediaQueryListeners.set(query, listeners);

  const addListener = (listener: (event: MediaQueryListEvent) => void) => {
    listeners.add(listener);
  };

  const removeListener = (listener: (event: MediaQueryListEvent) => void) => {
    listeners.delete(listener);
  };

  return {
    matches: getMediaQueryMatches(query),
    media: query,
    onchange: null,
    addEventListener: (_type, listener) => {
      addListener(listener);
    },
    removeEventListener: (_type, listener) => {
      removeListener(listener);
    },
    addListener,
    removeListener,
    dispatchEvent: () => true,
  };
};

vi.mock("next/link", () => ({
  default: React.forwardRef(function MockNextLink(
    {
      children,
      href,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string | { pathname?: string } },
    ref: React.ForwardedRef<HTMLAnchorElement>,
  ) {
    const resolvedHref =
      typeof href === "string"
        ? href
        : (href as { pathname?: string } | undefined)?.pathname ?? "";

    return React.createElement("a", { ...props, href: resolvedHref, ref }, children);
  }),
}));

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => createMatchMedia(query)),
  });

  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  mediaQueryListeners.clear();
  cleanup();
});
