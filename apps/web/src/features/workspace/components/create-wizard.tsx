import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Loader2,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { workspaceStore } from "@/features/workspace/store/workspace-store";
import {
  WORKSPACE_TEMPLATES,
  getWorkspaceTemplate,
  type WorkspaceTemplate,
  type TemplateCategory,
} from "@/api/adapters/templates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────
type WizardStep = 1 | 2 | 3 | 4;
type WorkspaceType = TemplateCategory;

type WizardData = {
  name: string;
  description: string;
  icon: string;
  type: WorkspaceType | null;
  templateId: string | null;
  templateName: string | null;
};

const STEPS = [
  { number: 1 as const, label: "Details" },
  { number: 2 as const, label: "Type" },
  { number: 3 as const, label: "Template" },
  { number: 4 as const, label: "Review" },
];

// ─────────────────────────────────────────────────────────────────────────
// Wizard controller — editorial layout, generous whitespace
// ─────────────────────────────────────────────────────────────────────────
export const CreateWorkspaceWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [data, setData] = useState<WizardData>({
    name: "",
    description: "",
    icon: "",
    type: null,
    templateId: null,
    templateName: null,
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const idempotencyKeyRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36),
  );

  const goNext = () =>
    setCurrentStep((s) => Math.min(s + 1, 4) as WizardStep);
  const goBack = () =>
    setCurrentStep((s) => Math.max(s - 1, 1) as WizardStep);
  const goToStep = (step: WizardStep) => setCurrentStep(step);

  const updateData = (partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setServerError(null);
  };

  const setWorkspaceType = (type: WorkspaceType) => {
    updateData({ type, templateId: null, templateName: null });
    goNext();
  };

  const handleCreate = async () => {
    setServerError(null);
    setIsCreating(true);
    await new Promise((r) => setTimeout(r, 700));
    const ws = workspaceStore.create({
      name: data.name.trim(),
      description: data.description.trim(),
      icon: data.icon.trim() || undefined,
      type: data.type ?? "general",
      templateId: data.templateId,
      templateName: data.templateName,
    });
    setIsCreating(false);
    const tpl = data.templateId ? getWorkspaceTemplate(data.templateId) : null;
    const seededFolders = tpl?.preview.folders.length ?? 0;
    const seededDocs = tpl?.preview.documents.length ?? 0;
    toast.success(`"${ws.name}" is ready`, {
      description:
        seededFolders + seededDocs > 0
          ? `Seeded ${seededFolders} folders and ${seededDocs} starter docs.`
          : "An empty workspace, ready for you to shape.",
    });
    navigate(`/w/${ws.id}`);
  };

  const stepTitle = {
    1: "Name your workspace",
    2: "What kind of work happens here",
    3: "Pick a starting point",
    4: "Review",
  }[currentStep];

  const stepDek = {
    1: "A name and a sentence is enough. You can refine everything later.",
    2: "Type controls templates, role labels, and whether submission workflows are available.",
    3: "Each template seeds a real structure — folders, starter docs, board, and roles.",
    4: "One last look at exactly what we'll create.",
  }[currentStep];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--app-bg)]">
      <div className="mx-auto max-w-[640px] px-6 sm:px-8 pt-12 sm:pt-16 pb-24">
        {/* Top row — back link + tiny step counter */}
        <div className="flex items-center justify-between mb-12">
          {currentStep === 1 ? (
            <Link
              to="/workspaces"
              className="inline-flex items-center gap-1.5 text-[12px] text-stone-400 hover:text-stone-700 transition-colors duration-200 focus-visible:outline-none focus-visible:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Workspaces
            </Link>
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 text-[12px] text-stone-400 hover:text-stone-700 transition-colors duration-200 focus-visible:outline-none focus-visible:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          )}
          <span className="font-mono text-[10px] text-stone-400 tracking-[0.22em] uppercase tabular-nums">
            {String(currentStep).padStart(2, "0")} / 04
          </span>
        </div>

        {/* Editorial header */}
        <header className="mb-12">
          <span className="font-mono text-[10px] text-stone-400 tracking-[0.22em] uppercase block mb-4">
            New Workspace
          </span>
          <h1
            className="text-[34px] sm:text-[40px] leading-[1.05] tracking-[-0.025em] text-stone-900"
            style={{ fontFamily: "Georgia, 'Iowan Old Style', 'Times New Roman', serif" }}
          >
            {stepTitle}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-stone-500 max-w-[44ch]">
            {stepDek}
          </p>
        </header>

        {/* Hairline progress */}
        <ProgressRail currentStep={currentStep} />

        {/* Step content */}
        <div className="mt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            >
              {currentStep === 1 && (
                <StepDetails data={data} onUpdate={updateData} onNext={goNext} />
              )}
              {currentStep === 2 && (
                <StepType
                  selectedType={data.type}
                  onSelect={setWorkspaceType}
                />
              )}
              {currentStep === 3 && data.type && (
                <StepTemplate
                  workspaceType={data.type}
                  selectedTemplateId={data.templateId}
                  onSelect={(id, name) => {
                    updateData({ templateId: id, templateName: name });
                    goNext();
                  }}
                />
              )}
              {currentStep === 4 && (
                <StepReview
                  data={data}
                  isCreating={isCreating}
                  serverError={serverError}
                  onCreate={handleCreate}
                  onEdit={goToStep}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Hairline progress rail
// ─────────────────────────────────────────────────────────────────────────
const ProgressRail = ({ currentStep }: { currentStep: WizardStep }) => (
  <div aria-label="Wizard progress" className="flex items-center gap-3">
    {STEPS.map((step) => {
      const isCompleted = currentStep > step.number;
      const isCurrent = currentStep === step.number;
      return (
        <div key={step.number} className="flex-1 flex flex-col gap-2">
          <div
            className={cn(
              "h-[2px] rounded-full transition-colors duration-500",
              (isCompleted || isCurrent) ? "bg-stone-900" : "bg-stone-200",
            )}
          />
          <span
            className={cn(
              "font-mono text-[10px] tracking-[0.18em] uppercase transition-colors duration-300",
              isCurrent ? "text-stone-900" : "text-stone-400",
            )}
          >
            {step.label}
          </span>
        </div>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// Step 1 — Details
// ─────────────────────────────────────────────────────────────────────────
const StepDetails = ({
  data,
  onUpdate,
  onNext,
}: {
  data: WizardData;
  onUpdate: (partial: Partial<WizardData>) => void;
  onNext: () => void;
}) => (
  <div className="space-y-10">
    <div className="space-y-1.5">
      <label
        htmlFor="ws-name"
        className="font-mono text-[10px] text-stone-400 tracking-[0.18em] uppercase block"
      >
        Name
      </label>
      <input
        id="ws-name"
        type="text"
        placeholder="Project Alpha"
        value={data.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        maxLength={60}
        autoFocus
        className="w-full bg-transparent border-0 border-b border-stone-200 px-0 py-3
          text-[24px] tracking-[-0.015em] text-stone-900 placeholder:text-stone-300
          focus:border-stone-900 focus:outline-none focus:ring-0
          transition-colors duration-200"
        style={{ fontFamily: "Georgia, 'Iowan Old Style', 'Times New Roman', serif" }}
      />
      <div className="flex items-center justify-between min-h-[18px]">
        {data.name.length > 0 && data.name.length < 3 ? (
          <p className="text-[12px] text-amber-700 flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            Three characters minimum.
          </p>
        ) : (
          <span />
        )}
        <span className="font-mono text-[10px] text-stone-300 tracking-wider tabular-nums">
          {data.name.length}/60
        </span>
      </div>
    </div>

    <div className="space-y-1.5">
      <label
        htmlFor="ws-desc"
        className="font-mono text-[10px] text-stone-400 tracking-[0.18em] uppercase block"
      >
        Description <span className="text-stone-300 normal-case tracking-normal">— optional</span>
      </label>
      <textarea
        id="ws-desc"
        placeholder="What's this workspace for?"
        value={data.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        maxLength={280}
        rows={2}
        className="w-full bg-transparent border-0 border-b border-stone-200 px-0 py-3
          text-[15px] leading-relaxed text-stone-900 placeholder:text-stone-300
          focus:border-stone-900 focus:outline-none focus:ring-0
          resize-none transition-colors duration-200"
      />
      <div className="text-right">
        <span className="font-mono text-[10px] text-stone-300 tracking-wider tabular-nums">
          {data.description.length}/280
        </span>
      </div>
    </div>

    <div className="space-y-1.5">
      <label
        htmlFor="ws-icon"
        className="font-mono text-[10px] text-stone-400 tracking-[0.18em] uppercase block"
      >
        Icon <span className="text-stone-300 normal-case tracking-normal">— optional, single emoji</span>
      </label>
      <input
        id="ws-icon"
        type="text"
        placeholder="📦"
        value={data.icon}
        onChange={(e) => onUpdate({ icon: e.target.value.slice(0, 2) })}
        maxLength={2}
        className="w-20 bg-transparent border-0 border-b border-stone-200 px-0 py-3
          text-[24px] text-stone-900 placeholder:text-stone-300
          focus:border-stone-900 focus:outline-none focus:ring-0
          transition-colors duration-200"
      />
    </div>

    <div className="pt-6 flex items-center justify-end">
      <button
        type="button"
        onClick={onNext}
        disabled={data.name.trim().length < 3}
        className="group inline-flex items-center gap-2 text-[13px] font-medium text-stone-900
          border-b border-stone-900 pb-1
          disabled:opacity-30 disabled:border-stone-300 disabled:cursor-not-allowed
          transition-opacity duration-150
          focus-visible:outline-none focus-visible:text-teal-700"
      >
        Continue
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 group-disabled:translate-x-0" />
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// Step 2 — Type (with explicit template-coupling preview)
// ─────────────────────────────────────────────────────────────────────────
const TYPE_OPTIONS: Array<{
  type: WorkspaceType;
  title: string;
  blurb: string;
  capabilities: string[];
  workflowFlag: string;
  Icon: typeof ShieldCheck;
}> = [
  {
    type: "professional",
    title: "Professional",
    blurb: "Software teams, product squads, agency engagements.",
    capabilities: [
      "Sprint, milestone & GTM boards",
      "Engineer / Consultant / Product Lead role labels",
      "PRD, RFC, ADR & status report templates",
    ],
    workflowFlag: "Submission workflow off · Direct publish",
    Icon: ShieldCheck,
  },
  {
    type: "academic",
    title: "Academic",
    blurb: "Thesis groups, research labs, term courses.",
    capabilities: [
      "Supervisor review board with revision states",
      "Student / Reviewer role labels",
      "Thesis, lit-review & coursework templates",
    ],
    workflowFlag: "Submission workflow on · Supervisor gates",
    Icon: GraduationCap,
  },
  {
    type: "general",
    title: "General",
    blurb: "Personal hubs, side projects, experiments.",
    capabilities: [
      "Light three-column board (Todo / Doing / Done)",
      "Owner role only — no review chain",
      "Personal Hub or fully Blank workspace",
    ],
    workflowFlag: "No workflows · Maximum freedom",
    Icon: Sparkles,
  },
];

const TYPE_ACCENTS: Record<WorkspaceType, string> = {
  professional: "bg-teal-500",
  academic: "bg-amber-500",
  general: "bg-stone-400",
};

const StepType = ({
  selectedType,
  onSelect,
}: {
  selectedType: WorkspaceType | null;
  onSelect: (type: WorkspaceType) => void;
}) => (
  <ul className="divide-y divide-stone-200 border-y border-stone-200">
    {TYPE_OPTIONS.map((opt, idx) => {
      const isSelected = selectedType === opt.type;
      const templateCount = WORKSPACE_TEMPLATES.filter((t) => t.category === opt.type).length;
      return (
        <li key={opt.type}>
          <button
            type="button"
            onClick={() => onSelect(opt.type)}
            aria-pressed={isSelected}
            className="group relative w-full text-left py-7 pl-5 flex items-start gap-6
              transition-colors duration-150
              focus-visible:outline-none focus-visible:bg-stone-50/60 hover:bg-stone-50/40"
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-0 top-8 w-[3px] rounded-r-full transition-all duration-300",
                TYPE_ACCENTS[opt.type],
                isSelected
                  ? "h-16 opacity-100"
                  : "h-0 opacity-0 group-hover:h-12 group-hover:opacity-100",
              )}
            />
            <span
              className="font-mono text-[10px] text-stone-300 tracking-[0.22em] tabular-nums w-8 shrink-0 group-hover:text-stone-900 transition-colors duration-200 mt-2"
              aria-hidden="true"
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3">
                <h3
                  className="text-[22px] tracking-[-0.015em] text-stone-900 group-hover:text-teal-700 transition-colors duration-200"
                  style={{ fontFamily: "Georgia, 'Iowan Old Style', 'Times New Roman', serif" }}
                >
                  {opt.title}
                </h3>
                <span className="font-mono text-[10px] text-stone-400 tracking-[0.15em] uppercase tabular-nums">
                  {templateCount} templates
                </span>
              </div>
              <p className="text-[14px] text-stone-500 mt-1.5 leading-relaxed">
                {opt.blurb}
              </p>
              <ul className="mt-4 space-y-1.5">
                {opt.capabilities.map((cap) => (
                  <li key={cap} className="flex items-start gap-2 text-[12.5px] text-stone-600 leading-relaxed">
                    <span aria-hidden="true" className="mt-1.5 h-px w-3 bg-stone-300 shrink-0" />
                    {cap}
                  </li>
                ))}
              </ul>
              <p className="font-mono text-[10px] text-stone-400 tracking-[0.15em] uppercase mt-4 flex items-center gap-1.5">
                <opt.Icon className="h-3 w-3" aria-hidden="true" />
                {opt.workflowFlag}
              </p>
            </div>
            <ArrowRight
              className={cn(
                "h-4 w-4 shrink-0 self-center transition-all duration-200",
                "text-stone-300 group-hover:text-stone-900 group-hover:translate-x-1",
              )}
            />
          </button>
        </li>
      );
    })}
  </ul>
);

// ─────────────────────────────────────────────────────────────────────────
// Step 3 — Template
// ─────────────────────────────────────────────────────────────────────────
const StepTemplate = ({
  workspaceType,
  selectedTemplateId,
  onSelect,
}: {
  workspaceType: WorkspaceType;
  selectedTemplateId: string | null;
  onSelect: (id: string, name: string) => void;
}) => {
  const [previewId, setPreviewId] = useState<string | null>(null);

  const templates = useMemo(
    () => WORKSPACE_TEMPLATES.filter((t) => t.category === workspaceType),
    [workspaceType],
  );

  const previewTemplate = previewId
    ? WORKSPACE_TEMPLATES.find((t) => t.id === previewId) ?? null
    : null;

  return (
    <>
      <ul className="divide-y divide-stone-200 border-y border-stone-200">
        {templates.map((template, idx) => {
          const folders = template.preview.folders.length;
          const docs = template.preview.documents.length;
          const cols = template.preview.taskColumns.length;
          const sub = template.preview.settings.submissionWorkflowEnabled;
          const sup = template.preview.settings.supervisorReviewEnabled;
          return (
            <li key={template.id}>
              <div className="group py-6 flex items-baseline gap-6">
                <span
                  className="font-mono text-[10px] text-stone-300 tracking-[0.22em] tabular-nums w-8 shrink-0"
                  aria-hidden="true"
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelect(template.id, template.name)}
                    aria-pressed={selectedTemplateId === template.id}
                    className="text-left w-full focus-visible:outline-none focus-visible:underline"
                  >
                    <h3
                      className="text-[18px] tracking-[-0.01em] text-stone-900 group-hover:text-teal-700 transition-colors duration-200"
                      style={{ fontFamily: "Georgia, 'Iowan Old Style', 'Times New Roman', serif" }}
                    >
                      {template.name}
                    </h3>
                    <p className="text-[12.5px] text-stone-500 italic mt-0.5">
                      {template.tagline}
                    </p>
                    <p className="text-[13px] text-stone-600 mt-2 leading-relaxed pr-6">
                      {template.description}
                    </p>
                  </button>

                  {/* Seeded outputs preview chips */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <SeedChip>{folders} folders</SeedChip>
                    <SeedChip>{docs} starter docs</SeedChip>
                    <SeedChip>{cols}-col board</SeedChip>
                    <SeedChip>Role · {template.preview.settings.roleLabel}</SeedChip>
                    {sub && <SeedChip tone="amber">Submission workflow</SeedChip>}
                    {sup && <SeedChip tone="amber">Supervisor review</SeedChip>}
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewId(template.id);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-900 transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
                    >
                      <Eye className="h-3 w-3" />
                      Preview full structure
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(template.id, template.name)}
                  className="self-center inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-900 border-b border-stone-300 hover:border-stone-900 pb-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:text-teal-700 focus-visible:border-teal-700"
                >
                  Choose
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <TemplatePreviewDialog
        template={previewTemplate}
        onClose={() => setPreviewId(null)}
        onChoose={(t) => {
          onSelect(t.id, t.name);
          setPreviewId(null);
        }}
      />
    </>
  );
};

const SeedChip = ({
  children,
  tone = "stone",
}: {
  children: React.ReactNode;
  tone?: "stone" | "amber";
}) => (
  <span
    className={cn(
      "font-mono text-[10px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded border",
      tone === "amber"
        ? "text-amber-800 border-amber-200 bg-amber-50/60"
        : "text-stone-600 border-stone-200 bg-stone-50/60",
    )}
  >
    {children}
  </span>
);

const TemplatePreviewDialog = ({
  template,
  onClose,
  onChoose,
}: {
  template: WorkspaceTemplate | null;
  onClose: () => void;
  onChoose: (t: WorkspaceTemplate) => void;
}) => (
  <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
      {template && (
        <>
          <DialogHeader>
            <p className="font-mono text-[10px] text-stone-400 tracking-[0.22em] uppercase">
              {template.category} template
            </p>
            <DialogTitle
              className="text-[24px] tracking-[-0.015em] text-stone-900 mt-1"
              style={{ fontFamily: "Georgia, 'Iowan Old Style', 'Times New Roman', serif" }}
            >
              {template.name}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-stone-500 leading-relaxed">
              {template.description}
            </DialogDescription>
          </DialogHeader>

          <dl className="space-y-5 py-4">
            <PreviewRow label="Folders">
              {template.preview.folders.length === 0 ? (
                <span className="text-[13px] text-stone-400 italic">No folders — start clean</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {template.preview.folders.map((f) => (
                    <span
                      key={f}
                      className="text-[12px] text-stone-700 border border-stone-200 px-2 py-0.5 rounded bg-stone-50/60"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </PreviewRow>

            <PreviewRow label="Starter docs">
              {template.preview.documents.length === 0 ? (
                <span className="text-[13px] text-stone-400 italic">No starter docs</span>
              ) : (
                <ul className="space-y-1">
                  {template.preview.documents.map((d) => (
                    <li key={d.title} className="text-[13px] text-stone-700 flex items-baseline gap-2">
                      <span className="text-stone-900">{d.title}</span>
                      <span className="font-mono text-[10px] text-stone-400 tracking-wider">
                        in {d.folder}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PreviewRow>

            <PreviewRow label="Task board">
              <div className="flex flex-wrap gap-1.5">
                {template.preview.taskColumns.map((col) => (
                  <span
                    key={col}
                    className="font-mono text-[10px] tracking-wider uppercase text-stone-600 border border-stone-200 px-1.5 py-0.5 rounded"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </PreviewRow>

            <PreviewRow label="Role label">
              <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-stone-700">
                {template.preview.settings.roleLabel}
              </span>
            </PreviewRow>

            <PreviewRow label="Workflow">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[13px]">
                  {template.preview.settings.submissionWorkflowEnabled ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-amber-700" />
                      <span className="text-stone-800">Submission workflow enabled</span>
                    </>
                  ) : (
                    <span className="text-stone-500">Direct publish — no submission gate</span>
                  )}
                </div>
                {template.preview.settings.supervisorReviewEnabled && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <Check className="h-3.5 w-3.5 text-amber-700" />
                    <span className="text-stone-800">Supervisor review chain</span>
                  </div>
                )}
              </div>
            </PreviewRow>
          </dl>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[12px] font-medium text-stone-500 hover:text-stone-900 transition-colors px-3 py-2"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onChoose(template)}
              className="inline-flex items-center gap-2 text-[12px] font-medium text-stone-900 border-b border-stone-900 pb-0.5"
            >
              Use this template
              <ArrowRight className="h-3 w-3" />
            </button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  </Dialog>
);

const PreviewRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-baseline gap-6">
    <dt className="font-mono text-[10px] text-stone-400 tracking-[0.18em] uppercase w-28 shrink-0 pt-0.5">
      {label}
    </dt>
    <dd className="flex-1 min-w-0">{children}</dd>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// Step 4 — Review with seeded-outputs summary
// ─────────────────────────────────────────────────────────────────────────
const StepReview = ({
  data,
  isCreating,
  serverError,
  onCreate,
  onEdit,
}: {
  data: WizardData;
  isCreating: boolean;
  serverError: string | null;
  onCreate: () => void;
  onEdit: (step: WizardStep) => void;
}) => {
  const tpl = data.templateId ? getWorkspaceTemplate(data.templateId) : null;

  return (
    <div className="space-y-12">
      {/* Definition list */}
      <dl className="divide-y divide-stone-200 border-y border-stone-200">
        <ReviewRow
          label="Name"
          onEdit={() => onEdit(1)}
          value={
            <div className="flex items-baseline gap-3">
              {data.icon && <span className="text-[20px]">{data.icon}</span>}
              <span
                className="text-[20px] tracking-[-0.015em] text-stone-900"
                style={{ fontFamily: "Georgia, 'Iowan Old Style', 'Times New Roman', serif" }}
              >
                {data.name || "Untitled"}
              </span>
            </div>
          }
        />
        {data.description && (
          <ReviewRow
            label="About"
            onEdit={() => onEdit(1)}
            value={
              <p className="text-[14px] text-stone-600 leading-relaxed">
                {data.description}
              </p>
            }
          />
        )}
        <ReviewRow
          label="Type"
          onEdit={() => onEdit(2)}
          value={
            <span className="font-mono text-[11px] text-stone-700 tracking-[0.15em] uppercase">
              {data.type}
            </span>
          }
        />
        <ReviewRow
          label="Template"
          onEdit={() => onEdit(3)}
          value={
            <div>
              <span className="text-[14px] text-stone-900">
                {data.templateName ?? "Blank"}
              </span>
              {tpl && (
                <p className="text-[12px] text-stone-500 mt-0.5 italic">{tpl.tagline}</p>
              )}
            </div>
          }
        />
        <ReviewRow
          label="Owner"
          value={
            <span className="text-[14px] text-stone-600">
              You · <span className="font-mono text-[11px] tracking-[0.15em] uppercase">
                {tpl?.preview.settings.roleLabel ?? "OWNER"}
              </span>
            </span>
          }
        />
      </dl>

      {/* What we'll create — seeded outputs summary */}
      {tpl && (
        <section aria-labelledby="seeded-heading" className="space-y-5">
          <div className="flex items-baseline justify-between">
            <h2
              id="seeded-heading"
              className="text-[18px] tracking-[-0.01em] text-stone-900"
              style={{ fontFamily: "Georgia, 'Iowan Old Style', 'Times New Roman', serif" }}
            >
              What we'll create
            </h2>
            <span className="font-mono text-[10px] text-stone-400 tracking-[0.18em] uppercase">
              On confirm
            </span>
          </div>

          <dl className="space-y-4 border-l border-stone-200 pl-5">
            <SeededRow label="Folders" count={tpl.preview.folders.length}>
              {tpl.preview.folders.length === 0 ? (
                <span className="text-[13px] text-stone-400 italic">None — start with an empty tree</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {tpl.preview.folders.map((f) => (
                    <span
                      key={f}
                      className="text-[12px] text-stone-700 border border-stone-200 px-2 py-0.5 rounded bg-stone-50/60"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </SeededRow>

            <SeededRow label="Starter docs" count={tpl.preview.documents.length}>
              {tpl.preview.documents.length === 0 ? (
                <span className="text-[13px] text-stone-400 italic">None</span>
              ) : (
                <ul className="space-y-0.5">
                  {tpl.preview.documents.map((d) => (
                    <li key={d.title} className="text-[12.5px] text-stone-700">
                      <span className="text-stone-900">{d.title}</span>
                      <span className="text-stone-400"> · {d.folder}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SeededRow>

            <SeededRow label="Task board" count={tpl.preview.taskColumns.length}>
              <div className="flex flex-wrap gap-1.5">
                {tpl.preview.taskColumns.map((col) => (
                  <span
                    key={col}
                    className="font-mono text-[10px] tracking-wider uppercase text-stone-600 border border-stone-200 px-1.5 py-0.5 rounded"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </SeededRow>

            <SeededRow label="Workflow">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[13px]">
                  {tpl.preview.settings.submissionWorkflowEnabled ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
                      <span className="text-stone-800">Submission workflow enabled</span>
                    </>
                  ) : (
                    <span className="text-stone-500">Direct publish — no submission gate</span>
                  )}
                </div>
                {tpl.preview.settings.supervisorReviewEnabled && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <Check className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
                    <span className="text-stone-800">Supervisor review chain on tasks</span>
                  </div>
                )}
              </div>
            </SeededRow>
          </dl>
        </section>
      )}

      {!tpl && data.type && (
        <section className="border-l border-stone-200 pl-5">
          <p className="text-[13px] text-stone-500 leading-relaxed">
            No template selected. We'll create an empty workspace with a default
            three-column board and no starter content.
          </p>
        </section>
      )}

      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 text-[13px] text-red-700"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link
          to="/workspaces"
          className="text-[12px] text-stone-400 hover:text-stone-700 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className="group inline-flex items-center gap-2 text-[13px] font-medium text-stone-900
            border-b border-stone-900 pb-1
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-opacity duration-150
            focus-visible:outline-none focus-visible:text-teal-700"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Setting up
            </>
          ) : (
            <>
              Create workspace
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const SeededRow = ({
  label,
  count,
  children,
}: {
  label: string;
  count?: number;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-6">
    <dt className="w-28 shrink-0 pt-0.5">
      <span className="font-mono text-[10px] text-stone-400 tracking-[0.18em] uppercase block">
        {label}
      </span>
      {typeof count === "number" && (
        <span className="font-mono text-[10px] text-stone-300 tracking-wider tabular-nums mt-0.5 block">
          {String(count).padStart(2, "0")}
        </span>
      )}
    </dt>
    <dd className="flex-1 min-w-0">{children}</dd>
  </div>
);

const ReviewRow = ({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
}) => (
  <div className="flex items-start gap-6 py-5">
    <dt className="font-mono text-[10px] text-stone-400 tracking-[0.18em] uppercase w-24 shrink-0 pt-1.5">
      {label}
    </dt>
    <dd className="flex-1 min-w-0">{value}</dd>
    {onEdit && (
      <button
        type="button"
        onClick={onEdit}
        className="text-[11px] text-stone-400 hover:text-stone-900 transition-colors duration-150 pt-1.5 focus-visible:outline-none focus-visible:underline"
        aria-label={`Edit ${label.toLowerCase()}`}
      >
        Edit
      </button>
    )}
  </div>
);
