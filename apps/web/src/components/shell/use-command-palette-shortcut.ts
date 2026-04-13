"use client";

import * as React from "react";

import {
  handleCommandPaletteShortcut,
  isMacLikePlatform,
} from "./command-palette-shortcut";

type UseCommandPaletteShortcutOptions = {
  enabled: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onRefocusInput: () => void;
};

export const useCommandPaletteShortcut = ({
  enabled,
  isOpen,
  onOpen,
  onRefocusInput,
}: Readonly<UseCommandPaletteShortcutOptions>) => {
  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const isMacLike = isMacLikePlatform({
      platform: window.navigator.platform,
      userAgent: window.navigator.userAgent,
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      handleCommandPaletteShortcut({
        enabled: true,
        event,
        isMacLike,
        isOpen,
        onOpen,
        onRefocusInput,
      });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, isOpen, onOpen, onRefocusInput]);
};

