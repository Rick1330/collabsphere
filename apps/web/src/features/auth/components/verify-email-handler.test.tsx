import React from "react";
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

const arrangeVerifyEmail = ({
  status,
  body,
}: {
  status: number;
  body: Record<string, unknown>;
}) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

  it("renders the missing-state immediately when the route token is missing", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    renderVerifyEmailHandler("   ");

    expect(await screen.findByText("No verification token")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "renders the success state for a valid token",
      token: "valid-token",
      status: 200,
      body: {
        data: {
          message: "Email verified successfully.",
        },
      },
      expectedHeading: "Email verified",
      expectedActionLabel: "Continue to sign in",
    },
    {
      name: "renders an expired-link state with resend guidance",
      token: "expired-token",
      status: 410,
      body: {
        error: {
          code: "TOKEN_EXPIRED",
          message: "Verification token has expired",
        },
      },
      expectedHeading: "Verification link expired",
      expectedActionLabel: "Back to sign in",
    },
    {
      name: "renders an already-verified state for used tokens",
      token: "used-token",
      status: 400,
      body: {
        error: {
          code: "TOKEN_ALREADY_USED",
          message: "Verification token has already been used",
        },
      },
      expectedHeading: "Already verified",
      expectedActionLabel: "Continue to sign in",
    },
    {
      name: "renders the invalid-link state for missing or invalid tokens",
      token: "bad-token",
      status: 400,
      body: {
        error: {
          code: "TOKEN_INVALID",
          message: "Verification token is invalid",
        },
      },
      expectedHeading: "Invalid link",
      expectedActionLabel: "Back to sign in",
    },
  ])("$name", async ({ token, status, body, expectedHeading, expectedActionLabel }) => {
    arrangeVerifyEmail({
      status,
      body,
    });

    renderVerifyEmailHandler(token);

    expect(await screen.findByText(expectedHeading)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: expectedActionLabel })).toHaveAttribute("href", "/login");
  });

  it("renders the transient-error state for unexpected API error codes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "SERVICE_UNAVAILABLE",
              message: "Database connection failed",
            },
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    renderVerifyEmailHandler("some-token");

    expect(await screen.findByText("We couldn't reach the verification service")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Try again",
      }),
    ).toBeInTheDocument();
  });

  it("fires exactly twice when the token changes", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { message: "Email verified successfully." } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <VerifyEmailHandler key="token-a" token="token-a" />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await screen.findByText("Email verified");

    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <VerifyEmailHandler key="token-b" token="token-b" />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await screen.findByText("Email verified");

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchSpy.mock.calls[0][1].body).token).toBe("token-a");
    expect(JSON.parse(fetchSpy.mock.calls[1][1].body).token).toBe("token-b");
  });

  it("fires exactly once in StrictMode", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { message: "Email verified successfully." } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <React.StrictMode>
            <VerifyEmailHandler key="token-a" token="token-a" />
          </React.StrictMode>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await screen.findByText("Email verified");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
