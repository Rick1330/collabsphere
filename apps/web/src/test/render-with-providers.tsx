import { render, type RenderOptions } from "@testing-library/react";
import * as React from "react";

import { AppProviders } from "../components/providers/app-providers";

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) =>
  render(ui, {
    wrapper: ({ children }) => <AppProviders>{children}</AppProviders>,
    ...options,
  });
