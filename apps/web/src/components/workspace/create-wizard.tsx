"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@collabsphere/ui/components/button";
import { Input } from "@collabsphere/ui/components/input";
import { cn } from "@collabsphere/ui/lib/utils";

import type { WorkspaceType } from "@/lib/api/workspaces";

type WizardStep = 0 | 1 | 2;

const workspaceTypes: Array<{
  value: WorkspaceType;
  title: string;
  description: string;
  features: readonly string[];
}> = [
  {
    value: "professional",
    title: "Professional",
    description: "Client work, internal delivery, and operational planning.",
    features: ["DELIVERY", "CLIENTS", "REVIEWS"],
  },
  {
    value: "academic",
    title: "Academic",
    description: "Research groups, seminars, and structured coursework.",
    features: ["SUBMISSIONS", "RUBRICS", "MEMBERS"],
  },
  {
    value: "general",
    title: "General",
    description: "Lightweight collaboration without a specialized workflow.",
    features: ["DOCS", "TASKS", "NOTES"],
  },
] as const;

const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("en", { granularity: "grapheme" })
    : null;

const clampGraphemes = (value: string, max: number) => {
  if (!graphemeSegmenter) {
    return Array.from(value).slice(0, max).join("");
  }

  const segments = Array.from(graphemeSegmenter.segment(value), (segment) => segment.segment);
  return segments.slice(0, max).join("");
};

function StepIntro({ description, title }: Readonly<{ title: string; description: string }>) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
      <p className="mt-1 text-sm text-stone-500">{description}</p>
    </div>
  );
}

function FieldLabel({ htmlFor, label }: Readonly<{ htmlFor: string; label: string }>) {
  return (
    <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor={htmlFor}>
      {label}
    </label>
  );
}

function CharacterCount({ current, max }: Readonly<{ current: number; max: number }>) {
  return <p className="mt-2 font-mono text-[11px] text-stone-400">{current}/{max}</p>;
}

function FeaturePills({ features }: Readonly<{ features: readonly string[] }>) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {features.map((feature) => (
        <span
          key={feature}
          className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500"
        >
          {feature}
        </span>
      ))}
    </div>
  );
}

function WizardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
          Workspace setup
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">Create workspace</h1>
        <p className="mt-2 text-sm text-stone-500">
          Configure the first details now. Submission wiring can attach to the real create endpoint without changing this flow.
        </p>
      </div>
      <Link
        href="/workspaces"
        className="inline-flex min-h-9 items-center justify-center rounded-[0.7rem] px-3 py-1.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--surface-card)_82%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2"
      >
        Back
      </Link>
    </div>
  );
}

function WizardProgress({ step }: Readonly<{ step: WizardStep }>) {
  return (
    <ol aria-label="Wizard progress" className="grid grid-cols-3 gap-3">
      {["Details", "Type", "Review"].map((label, index) => {
        const isComplete = index < step;
        const isCurrent = index === step;
        return (
          <li key={label}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3",
                isComplete && "border-teal-200 bg-teal-50 text-teal-700",
                isCurrent && "border-teal-300 bg-white text-teal-700 shadow-sm",
                !isComplete && !isCurrent && "border-stone-200 bg-stone-50 text-stone-500",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-white font-mono text-xs">
                {isComplete ? "✓" : index + 1}
              </span>
              <span className="text-sm font-medium">{label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function DetailsStep({
  canContinue,
  description,
  icon,
  name,
  onDescriptionChange,
  onIconChange,
  onNameChange,
  onNext,
}: Readonly<{
  name: string;
  description: string;
  icon: string;
  canContinue: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onNext: () => void;
}>) {
  return (
    <div className="space-y-5">
      <StepIntro
        title="Name your workspace"
        description="Give it a clear name first. The rest of the flow adapts around that choice."
      />
      <div className="grid gap-4">
        <div>
          <FieldLabel htmlFor="workspace-name" label="Workspace name" />
          <Input
            id="workspace-name"
            value={name}
            maxLength={60}
            onChange={(event) => {
              onNameChange(event.currentTarget.value);
            }}
            placeholder="Project Aurora"
            className="h-12 rounded-xl border-stone-200"
          />
          <CharacterCount current={name.length} max={60} />
        </div>
        <div>
          <FieldLabel htmlFor="workspace-description" label="Description" />
          <textarea
            id="workspace-description"
            value={description}
            maxLength={280}
            onChange={(event) => {
              onDescriptionChange(event.currentTarget.value);
            }}
            placeholder="What is this workspace for?"
            className="min-h-28 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-500/20"
          />
          <CharacterCount current={description.length} max={280} />
        </div>
        <div className="max-w-24">
          <FieldLabel htmlFor="workspace-icon" label="Icon" />
          <Input
            id="workspace-icon"
            value={icon}
            onChange={(event) => {
              onIconChange(clampGraphemes(event.currentTarget.value, 2));
            }}
            placeholder="🚀"
            className="h-12 rounded-xl border-stone-200 text-center text-lg"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button disabled={!canContinue} onClick={onNext}>
          Choose type
        </Button>
      </div>
    </div>
  );
}

function TypeStep({
  onBack,
  onSelect,
  type,
}: Readonly<{
  type: WorkspaceType;
  onBack: () => void;
  onSelect: (value: WorkspaceType) => void;
}>) {
  return (
    <div className="space-y-5">
      <StepIntro
        title="Choose a workspace type"
        description="Pick the tone that fits the team. You can refine this later once the full workspace domain arrives."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {workspaceTypes.map((option) => {
          const selected = option.value === type;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={cn(
                "rounded-2xl border p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2",
                selected ? "border-teal-300 bg-teal-50/70 shadow-sm" : "border-stone-200 bg-white",
              )}
            >
              <p className="text-base font-semibold text-stone-900">{option.title}</p>
              <p className="mt-2 text-sm text-stone-500">{option.description}</p>
              <FeaturePills features={option.features} />
            </button>
          );
        })}
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({
  description,
  icon,
  name,
  onBack,
  selectedType,
}: Readonly<{
  name: string;
  description: string;
  icon: string;
  selectedType: { title: string };
  onBack: () => void;
}>) {
  return (
    <div className="space-y-5">
      <StepIntro
        title="Review your draft"
        description="This polished shell is ready. The final create mutation can attach here once the write endpoint is active."
      />
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <dl className="grid gap-4 text-sm">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">Workspace name</dt>
            <dd className="mt-1 font-semibold text-stone-900">{name}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">Description</dt>
            <dd className="mt-1 text-stone-700">{description || "No description"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">Type</dt>
            <dd className="mt-1 text-stone-700">{selectedType.title}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">Icon</dt>
            <dd className="mt-1 text-stone-700">{icon || "Auto-generated initials"}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        The creation workflow is ready for the real mutation contract. Final submission remains intentionally blocked until the matching backend create endpoint is wired.
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button disabled>Create workspace</Button>
      </div>
    </div>
  );
}

export function CreateWizard() {
  const [step, setStep] = useState<WizardStep>(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [type, setType] = useState<WorkspaceType>("professional");

  const canContinue = name.trim().length >= 3;
  const selectedType = useMemo(
    () => workspaceTypes.find((option) => option.value === type) ?? workspaceTypes[0],
    [type],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <WizardHeader />
      <WizardProgress step={step} />

      <section className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
        {step === 0 ? (
          <DetailsStep
            canContinue={canContinue}
            description={description}
            icon={icon}
            name={name}
            onDescriptionChange={setDescription}
            onIconChange={setIcon}
            onNameChange={setName}
            onNext={() => setStep(1)}
          />
        ) : null}

        {step === 1 ? (
          <TypeStep
            onBack={() => setStep(0)}
            onSelect={(value) => {
              setType(value);
              setStep(2);
            }}
            type={type}
          />
        ) : null}

        {step === 2 ? (
          <ReviewStep
            description={description}
            icon={icon}
            name={name}
            onBack={() => setStep(1)}
            selectedType={selectedType}
          />
        ) : null}
      </section>
    </div>
  );
}
