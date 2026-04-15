import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("next=%2Fdashboard"),
}));

import { ForgotPasswordForm } from "../forgot-password-form";
import { LoginForm } from "../login-form";
import { RegisterForm } from "../register-form";
import { ResetPasswordForm } from "../reset-password-form";
import { VerifyEmailPanel } from "../verify-email-panel";
import { renderWithProviders } from "../../shell/__tests__/render-with-providers";

const makeJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });

describe("public auth experience", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("submits the login form and redirects to the requested protected route", async () => {
    const user = userEvent.setup();
    const redirectSpy = vi.fn();
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({
        data: {
          accessToken: "access-token",
          user: {
            id: "user-1",
            email: "jane@example.com",
            fullName: "Jane Doe",
            globalRole: "USER",
            isVerified: true,
          },
        },
      }),
    );

    renderWithProviders(<LoginForm onSuccessRedirect={redirectSpy} />);

    await user.type(
      screen.getByLabelText("Email address"),
      "jane@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "StrongPass@123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/auth/login",
        expect.objectContaining({
          method: "POST",
        }),
      );
      expect(redirectSpy).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows the registration success state after account creation", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({
        data: {
          message: "Registration successful. Please verify your email.",
        },
      }, 201),
    );

    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText("Full name"), "Jane Doe");
    await user.type(
      screen.getByLabelText("Email address"),
      "jane@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "StrongPass@123");
    await user.type(
      screen.getByLabelText("Confirm password"),
      "StrongPass@123",
    );
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByRole("heading", {
        name: "Check your inbox before signing in",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/jane@example.com/)).toBeInTheDocument();
  });

  it("shows the generic forgot-password success state", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({
        data: {
          message: "If an account exists, a reset link has been sent.",
        },
      }),
    );

    renderWithProviders(<ForgotPasswordForm />);

    await user.type(
      screen.getByLabelText("Email address"),
      "jane@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(
      await screen.findByRole("heading", { name: "Check your inbox" }),
    ).toBeInTheDocument();
  });

  it("surfaces expired reset tokens truthfully", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse(
        {
          error: {
            code: "TOKEN_EXPIRED",
          },
        },
        410,
      ),
    );

    renderWithProviders(<ResetPasswordForm token="expired-token" />);

    await user.type(screen.getByLabelText("New password"), "StrongPass@123");
    await user.type(
      screen.getByLabelText("Confirm password"),
      "StrongPass@123",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(
      await screen.findByRole("heading", {
        name: "This reset link has expired",
      }),
    ).toBeInTheDocument();
  });

  it("verifies the email token automatically on load", async () => {
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({
        data: {
          message: "Email verified successfully.",
        },
      }),
    );

    renderWithProviders(<VerifyEmailPanel token="verify-token" />);

    expect(
      await screen.findByRole("heading", {
        name: "Your email has been verified",
      }),
    ).toBeInTheDocument();
  });
});
