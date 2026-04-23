import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  Check,
  FilePlus,
  FolderPlus,
  LayoutTemplate,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DOCUMENT_TEMPLATES } from "@/api/adapters/templates";
import { cn } from "@/lib/utils";

interface BaseProps {
  open: boolean;
  onClose: () => void;
}

interface DocDialogProps extends BaseProps {
  kind: "document";
  folderName: string | null;
  /**
   * Called when the user confirms creation. `templateId` is always provided —
   * `"doc-blank"` for a blank document, otherwise the picked document template.
   */
  onCreated: (title: string, templateId: string) => void;
}

interface FolderDialogProps extends BaseProps {
  kind: "folder";
  parentName: string | null;
  onCreated: (name: string) => void;
}

// Six picks — keeps the dialog compact, mirrors the picks in /documents/new.
const TEMPLATE_PICKS = DOCUMENT_TEMPLATES.slice(0, 6);

export const TreeCreateDialog = (props: DocDialogProps | FolderDialogProps) => {
  const [value, setValue] = useState("");
  const [templateId, setTemplateId] = useState<string>("doc-blank");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDoc = props.kind === "document";
  const max = isDoc ? 200 : 120;
  const label = isDoc ? "Document title" : "Folder name";
  const placeholder = isDoc
    ? "e.g., Project Roadmap, Meeting Notes"
    : "e.g., Chapter 1, Architecture, Meetings";
  const title = isDoc ? "New document" : "New folder";
  const desc = isDoc
    ? props.kind === "document" && props.folderName
      ? `Create a new document in "${props.folderName}".`
      : "Create a new document at the workspace root."
    : props.kind === "folder" && props.parentName
      ? `Create a new subfolder inside "${props.parentName}".`
      : "Create a new folder at the workspace root.";

  const handleClose = () => {
    setValue("");
    setTemplateId("doc-blank");
    setError(null);
    setSubmitting(false);
    props.onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError(`${label} is required.`);
      return;
    }
    if (trimmed.length > max) {
      setError(`Must be ${max} characters or less.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    // Simulated async create
    await new Promise((r) => setTimeout(r, 350));
    if (props.kind === "document") props.onCreated(trimmed, templateId);
    else props.onCreated(trimmed);
    setSubmitting(false);
    setValue("");
    setTemplateId("doc-blank");
  };

  return (
    <Dialog open={props.open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className={cn(
          "bg-white border-stone-200",
          isDoc ? "max-w-lg" : "max-w-md",
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-stone-900">{title}</DialogTitle>
          <DialogDescription className="text-stone-500">{desc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label
              htmlFor="tree-create-input"
              className="text-sm font-medium text-stone-700 mb-1.5 block"
            >
              {label}
            </label>
            <input
              id="tree-create-input"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              maxLength={max + 10}
              className="w-full h-11 px-3.5 rounded-lg text-sm bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150"
            />
            {error && (
              <p className="text-[13px] text-red-500 mt-1.5 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </p>
            )}
          </div>

          {isDoc && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-sm font-medium text-stone-700 flex items-center gap-1.5"
                  id="tree-create-template-label"
                >
                  <LayoutTemplate className="h-3.5 w-3.5 text-stone-400" />
                  Template
                </label>
                <span className="font-mono text-[10px] text-stone-400 tracking-[0.16em] uppercase">
                  Optional
                </span>
              </div>
              <ul
                role="radiogroup"
                aria-labelledby="tree-create-template-label"
                className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 -mr-1"
              >
                {TEMPLATE_PICKS.map((t) => {
                  const active = t.id === templateId;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setTemplateId(t.id)}
                        className={cn(
                          "w-full text-left rounded-lg border p-2.5 transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30",
                          active
                            ? "border-stone-900 bg-stone-50/70 shadow-sm"
                            : "border-stone-200 bg-white hover:border-stone-300",
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={cn(
                              "h-5 w-5 rounded flex items-center justify-center flex-shrink-0 border mt-0.5",
                              active
                                ? "bg-stone-900 border-stone-900 text-white"
                                : "bg-stone-50 border-stone-200 text-transparent",
                            )}
                            aria-hidden="true"
                          >
                            <Check className="h-3 w-3" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[12.5px] font-semibold text-stone-900 truncate">
                              {t.name}
                            </div>
                            <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                              {t.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : isDoc ? (
                <>
                  <FilePlus className="h-3.5 w-3.5" />
                  Create document
                </>
              ) : (
                <>
                  <FolderPlus className="h-3.5 w-3.5" />
                  Create folder
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
