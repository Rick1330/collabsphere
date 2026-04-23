import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SettingsSection } from "./settings-section";
import { fetchCurrentUser, updateProfile } from "@/api/adapters/settings";
import { getAvatarColor, getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Too short").max(100, "Too long"),
  bio: z.string().max(280, "Bio must be 280 characters or less").optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export const ProfileForm = () => {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ["user", "me"],
    queryFn: fetchCurrentUser,
  });

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", bio: "" },
  });

  // Sync defaults once user loads
  useEffect(() => {
    if (user) {
      form.reset({ fullName: user.fullName, bio: user.bio ?? "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const mutation = useMutation({
    mutationFn: (values: ProfileValues) => updateProfile({ fullName: values.fullName.trim(), bio: values.bio?.trim() || undefined }),
    onSuccess: (next, values) => {
      queryClient.setQueryData(["user", "me"], next);
      toast.success("Profile updated");
      form.reset({ fullName: values.fullName, bio: values.bio ?? "" });
    },
    onError: () => toast.error("Failed to update profile."),
  });

  const bioValue = form.watch("bio") ?? "";
  const avatarBg = useMemo(() => (user ? getAvatarColor(user.id) : "#0D9488"), [user]);

  return (
    <SettingsSection title="Profile" description="Manage your personal information.">
      {isLoading || !user ? (
        <div className="space-y-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-stone-100" />
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-stone-100" />
              <div className="h-3 w-56 rounded bg-stone-100" />
            </div>
          </div>
          <div className="h-9 rounded bg-stone-100" />
          <div className="h-9 rounded bg-stone-100" />
          <div className="h-20 rounded bg-stone-100" />
        </div>
      ) : (
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center text-white font-semibold text-base shrink-0"
              style={{ background: avatarBg }}
              aria-hidden="true"
            >
              {getInitials(user.fullName, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 truncate">{user.fullName}</p>
              <p className="font-mono text-[10px] text-stone-400 tracking-wider mt-0.5">
                AVATAR UPLOAD COMING IN A FUTURE UPDATE
              </p>
            </div>
          </div>

          {/* Full name */}
          <div>
            <label htmlFor="fullName" className="block text-[13px] font-medium text-stone-700 mb-1.5">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              {...form.register("fullName")}
              className={cn(
                "w-full h-9 px-3 rounded-lg border bg-white text-sm text-stone-900",
                "placeholder:text-stone-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500",
                form.formState.errors.fullName ? "border-red-300" : "border-stone-200",
              )}
            />
            {form.formState.errors.fullName && (
              <p className="mt-1.5 text-[13px] text-red-500 flex items-center gap-1.5" role="alert">
                <AlertCircle className="h-3.5 w-3.5" />
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email — read only */}
          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-stone-700 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="w-full h-9 px-3 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-500 cursor-not-allowed"
            />
            <p className="mt-1.5 text-[12px] text-stone-400">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="bio" className="text-[13px] font-medium text-stone-700">
                Bio
              </label>
              <span className="font-mono text-[10px] text-stone-400 tracking-wider">OPTIONAL</span>
            </div>
            <textarea
              id="bio"
              rows={3}
              maxLength={280}
              {...form.register("bio")}
              className={cn(
                "w-full px-3 py-2 rounded-lg border bg-white text-sm text-stone-900 resize-none",
                "placeholder:text-stone-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500",
                form.formState.errors.bio ? "border-red-300" : "border-stone-200",
              )}
              placeholder="Tell your team a little about yourself."
            />
            <div className="flex justify-between mt-1.5">
              {form.formState.errors.bio ? (
                <p className="text-[13px] text-red-500 flex items-center gap-1.5" role="alert">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.bio.message}
                </p>
              ) : (
                <span />
              )}
              <span className="font-mono text-[10px] text-stone-400 tracking-wider">{bioValue.length}/280</span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={mutation.isPending || !form.formState.isDirty}
              className={cn(
                "h-9 px-5 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-medium text-white",
                "transition-colors flex items-center gap-1.5",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-1",
              )}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      )}
    </SettingsSection>
  );
};

// Suppress unused warning on stable form state ref imports
void useState;
