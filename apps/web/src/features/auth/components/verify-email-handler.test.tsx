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
      expectedActionLabel: "Go to sign in to request a new verification email",
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
      expectedActionLabel: "Go to sign in to request a new verification email",
    },
    {
      name: "renders invalid-link state for unexpected API error codes",
      token: "service-down-token",
      status: 503,
      body: {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Email verification service unavailable",
        },
      },
      expectedHeading: "Invalid link",
      expectedActionLabel: "Go to sign in to request a new verification email",
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

  it("renders the invalid-link fallback for unexpected API error codes", async () => {
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

    expect(await screen.findByText("Invalid link")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Go to sign in to request a new verification email",
      }),
    ).toHaveAttribute("href", "/login");
  });
});
