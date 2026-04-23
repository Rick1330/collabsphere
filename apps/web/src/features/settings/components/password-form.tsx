import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SettingsSection } from "./settings-section";
import { changePassword, fetchCurrentUser } from "@/api/adapters/settings";
import { getPasswordStrength, PasswordStrength } from "@/features/auth/components/password-strength";
import { cn } from "@/lib/utils";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Needs lowercase")
      .regex(/[A-Z]/, "Needs uppercase")
      .regex(/\d/, "Needs a number")
      .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Needs special character"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must differ from current",
    path: ["newPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export const PasswordForm = () => {
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: fetchCurrentUser,
  });

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onChange",
  });

  const watchedNew = form.watch("newPassword") ?? "";
  const strength = getPasswordStrength(watchedNew);

  const mutation = useMutation({
    mutationFn: (v: PasswordValues) =>
      changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: () => {
      toast.success("Password updated");
      form.reset();
      setServerError(null);
    },
    onError: (err: unknown) => {
      const code = (err as { code?: string })?.code;
      if (code === "INVALID_CREDENTIALS") {
        setServerError("Current password is incorrect.");
      } else {
        setServerError("Failed to update password.");
      }
    },
  });

  const isOAuth = user?.authProvider === "google";

  return (
    <SettingsSection title="Password" description="Keep your account secure with a strong password.">
      {isOAuth ? (
        <div className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3.5">
          <div className="h-8 w-8 rounded-full bg-white border border-stone-200 flex items-center justify-center shrink-0 text-stone-500">
            <Info className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900">Password not available</p>
            <p className="mt-0.5 text-[13px] text-stone-500">
              Your account uses Google sign-in. Password management is handled through your Google account.
            </p>
          </div>
        </div>
      ) : (
        <form
          onSubmit={form.handleSubmit((v) => {
            setServerError(null);
            mutation.mutate(v);
          })}
          className="space-y-6"
        >
          {serverError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          {/* Current */}
          <PasswordField
            id="currentPassword"
            label="Current password"
            autoComplete="current-password"
            register={form.register("currentPassword")}
            error={form.formState.errors.currentPassword?.message}
          />

          {/* New */}
          <div>
            <PasswordField
              id="newPassword"
              label="New password"
              autoComplete="new-password"
              register={form.register("newPassword")}
              error={form.formState.errors.newPassword?.message}
            />
            {watchedNew.length > 0 && (
              <div className="-mt-1">
                <PasswordStrength password={watchedNew} />
              </div>
            )}
          </div>

          {/* Confirm */}
          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            autoComplete="new-password"
            register={form.register("confirmPassword")}
            error={form.formState.errors.confirmPassword?.message}
          />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={mutation.isPending || strength < 4}
              className={cn(
                "h-9 px-5 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-medium text-white",
                "transition-colors flex items-center gap-1.5",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-1",
              )}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...
                </>
              ) : (
                "Update password"
              )}
            </button>
          </div>
        </form>
      )}
    </SettingsSection>
  );
};

function PasswordField({
  id,
  label,
  autoComplete,
  register,
  error,
}: Readonly<{
  id: string;
  label: string;
  autoComplete: string;
  register: ReturnType<ReturnType<typeof useForm<PasswordValues>>["register"]>;
  error?: string;
}>) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium text-stone-700 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        {...register}
        className={cn(
          "w-full h-9 px-3 rounded-lg border bg-white text-sm text-stone-900",
          "placeholder:text-stone-400 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500",
          error ? "border-red-300" : "border-stone-200",
        )}
      />
      {error && (
        <p className="mt-1.5 text-[13px] text-red-500 flex items-center gap-1.5" role="alert">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
