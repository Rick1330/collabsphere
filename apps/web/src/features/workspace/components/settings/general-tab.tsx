import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SettingsSection } from "@/features/settings/components/settings-section";
import { workspaceStore, type StoredWorkspaceType } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

const generalSchema = z.object({
  name: z.string().min(3, "At least 3 characters").max(60, "Max 60 characters"),
  description: z.string().max(280, "Max 280 characters").optional(),
  icon: z.string().max(2).optional(),
});

type GeneralValues = z.infer<typeof generalSchema>;

interface GeneralTabProps {
  workspaceId: string;
  workspace: {
    name: string;
    description?: string;
    icon?: string;
    type: StoredWorkspaceType;
  };
  onSaved: () => void;
}

const typeBadgeClass = (t: StoredWorkspaceType) =>
  t === "professional"
    ? "bg-teal-50 text-teal-600 border-teal-200"
    : t === "academic"
      ? "bg-amber-50 text-amber-600 border-amber-200"
      : "bg-stone-100 text-stone-500 border-stone-200";

export const GeneralTab = ({ workspaceId, workspace, onSaved }: GeneralTabProps) => {
  const form = useForm<GeneralValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description ?? "",
      icon: workspace.icon ?? "",
    },
  });

  const onSubmit = async (values: GeneralValues) => {
    try {
      await new Promise((r) => setTimeout(r, 400));
      const stored = workspaceStore.getById(workspaceId);
      if (stored) {
        // mutate via store API: re-create with new fields
        workspaceStore.remove(workspaceId);
        workspaceStore.create({
          id: workspaceId,
          name: values.name.trim(),
          description: values.description?.trim() ?? "",
          icon: values.icon || undefined,
          type: stored.type,
          templateId: stored.templateId,
          templateName: stored.templateName,
          roleLabel: stored.roleLabel,
        });
      }
      toast.success("Workspace settings updated");
      form.reset(values);
      onSaved();
    } catch {
      toast.error("Failed to update settings.");
    }
  };

  return (
    <SettingsSection title="General" description="Basic workspace information.">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="ws-name" className="text-sm font-medium text-stone-700 mb-1.5 block">
            Workspace name
          </label>
          <input
            id="ws-name"
            type="text"
            maxLength={60}
            className="w-full h-11 px-3.5 rounded-lg text-sm bg-white border border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150"
            {...form.register("name")}
          />
          <div className="flex items-center justify-between mt-1.5">
            {form.formState.errors.name ? (
              <p className="text-[13px] text-red-500 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {form.formState.errors.name.message}
              </p>
            ) : (
              <span />
            )}
            <span className="font-mono text-[10px] text-stone-400 tracking-wider">
              {form.watch("name")?.length ?? 0}/60
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label htmlFor="ws-desc" className="text-sm font-medium text-stone-700">
              Description
            </label>
            <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
              OPTIONAL
            </span>
          </div>
          <textarea
            id="ws-desc"
            rows={3}
            maxLength={280}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150 resize-none"
            {...form.register("description")}
          />
          <div className="flex items-center justify-between mt-1.5">
            {form.formState.errors.description ? (
              <p className="text-[13px] text-red-500 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {form.formState.errors.description.message}
              </p>
            ) : (
              <span />
            )}
            <span className="font-mono text-[10px] text-stone-400 tracking-wider">
              {form.watch("description")?.length ?? 0}/280
            </span>
          </div>
        </div>

        {/* Icon */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label htmlFor="ws-icon" className="text-sm font-medium text-stone-700">
              Icon
            </label>
            <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
              OPTIONAL
            </span>
          </div>
          <input
            id="ws-icon"
            maxLength={2}
            placeholder="📦"
            className="w-16 h-11 rounded-lg text-center text-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150"
            {...form.register("icon")}
          />
        </div>

        {/* Type (read-only) */}
        <div>
          <span className="text-sm font-medium text-stone-700 mb-1.5 block">Workspace type</span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border",
                typeBadgeClass(workspace.type),
              )}
            >
              {workspace.type}
            </span>
            <span className="text-xs text-stone-400">
              Type cannot be changed after creation.
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={form.formState.isSubmitting || !form.formState.isDirty}
            className="h-9 px-5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors flex items-center gap-1.5"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </form>
    </SettingsSection>
  );
};
