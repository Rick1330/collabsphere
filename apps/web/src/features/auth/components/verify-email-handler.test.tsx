import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VerifyEmailHandler } from "./verify-email-handler";

const renderVerifyEmailHandler = (token: string) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <VerifyEmailHandler token={token} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("VerifyEmailHandler", () => {
  it("renders the loading state before verification finishes", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>(() => {
            // Keep the request pending so the loading state is stable.
          }),
      ),
    );

    renderVerifyEmailHandler("pending-token");

    expect(screen.getByText("Verifying your email")).toBeInTheDocument();
  });

  it("renders the invalid-link state immediately when the route token is missing", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    renderVerifyEmailHandler("   ");

    expect(await screen.findByText("Invalid link")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders the success state for a valid token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              message: "Email verified successfully.",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    renderVerifyEmailHandler("valid-token");

    expect(await screen.findByText("Email verified")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue to sign in" })).toHaveAttribute("href", "/login");
  });

  it("renders an expired-link state with resend guidance", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "TOKEN_EXPIRED",
              message: "Verification token has expired",
            },
          }),
          {
            status: 410,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    renderVerifyEmailHandler("expired-token");

    expect(await screen.findByText("Verification link expired")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Go to sign in to request a new verification email",
      }),
    ).toHaveAttribute("href", "/login");
  });

  it("renders an already-verified state for used tokens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "TOKEN_ALREADY_USED",
              message: "Verification token has already been used",
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    renderVerifyEmailHandler("used-token");

    expect(await screen.findByText("Already verified")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue to sign in" })).toHaveAttribute("href", "/login");
  });

  it("renders the invalid-link state for missing or invalid tokens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "TOKEN_INVALID",
              message: "Verification token is invalid",
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    renderVerifyEmailHandler("bad-token");

    expect(await screen.findByText("Invalid link")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Go to sign in to request a new verification email",
      }),
    ).toHaveAttribute("href", "/login");
  });
});
