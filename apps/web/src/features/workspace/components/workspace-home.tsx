import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Archive,
  Users,
  Settings,
  FilePlus,
  ListPlus,
  UserPlus,
  FileText,
  Lock,
  AlertCircle,
  Activity as ActivityIcon,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  relativeTime,
  fullDateTime,
  formatDueDate,
  getInitials,
  getAvatarColor,
} from "@/lib/format";
import type { WorkspaceForSidebar } from "./workspace-sidebar";
import { toast } from "sonner";
import {
  CountChip,
  MetaDivider,
  MetaStat,
  PageHeader,
} from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { WorkspaceAcademicProgress } from "./workspace-academic-progress";

interface WorkspaceHomeProps {
  workspace: WorkspaceForSidebar & { memberCount: number };
  /**
   * Name of the workspace template this workspace was created from. When
   * present, a small badge is rendered in the page header so people can see
   * the workspace is wired to a template's structure.
   */
  templateName?: string | null;
}

interface DocItem {
  id: string;
  title: string;
  folderPath?: string;
  updatedAt: string;
  isLocked?: boolean;
  lockedBy?: { fullName: string };
  status: "draft" | "submitted" | "changes_requested" | "approved" | "archived";
}

interface TaskItem {
  id: string;
  title: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "todo" | "in_progress" | "in_review";
  dueDate?: string;
}

interface EventItem {
  id: string;
  actor: { id: string; fullName: string };
  action: string;
  resource?: { title: string };
  createdAt: string;
}

const MOCK_DOCS: DocItem[] = [
  {
    id: "d1",
    title: "Project Roadmap Q4",
    folderPath: "Product",
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    status: "approved",
  },
  {
    id: "d2",
    title: "API Design",
    folderPath: "Architecture",
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: "submitted",
  },
  {
    id: "d3",
    title: "Sprint Retro Week 12",
    folderPath: "Meetings",
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: "draft",
  },
  {
    id: "d4",
    title: "PRD v2",
    folderPath: "Product",
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isLocked: true,
    lockedBy: { fullName: "Eyob Bekele" },
    status: "changes_requested",
  },
  {
    id: "d5",
    title: "ADR-003 Prisma",
    folderPath: "Architecture",
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "approved",
  },
];

const MOCK_TASKS: TaskItem[] = [
  {
    id: "t1",
    title: "Implement login page",
    priority: "high",
    status: "todo",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "t2",
    title: "Fix login redirect bug",
    priority: "urgent",
    status: "in_progress",
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "t3",
    title: "Review PR #42 — auth refactor",
    priority: "medium",
    status: "in_review",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_EVENTS: EventItem[] = [
  {
    id: "e1",
    actor: { id: "u1", fullName: "Elshaday Tesfaye" },
    action: "assigned a task",
    resource: { title: "Implement login page" },
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "e2",
    actor: { id: "u2", fullName: "Eyob Bekele" },
    action: "moved to In Review",
    resource: { title: "Fix login redirect bug" },
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "e3",
    actor: { id: "u3", fullName: "Kidist Alemu" },
    action: "created a document",
    resource: { title: "API Design" },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "e4",
    actor: { id: "u4", fullName: "Mekonnen Desta" },
    action: "commented on",
    resource: { title: "Sprint Retro Week 12" },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

const typeBadge = (t: WorkspaceForSidebar["type"]) =>
  t === "professional"
    ? "bg-teal-50 text-teal-600 border-teal-200"
    : t === "academic"
      ? "bg-amber-50 text-amber-600 border-amber-200"
      : "bg-stone-100 text-stone-500 border-stone-200";

const isRecentlyEdited = (updatedAt: string) =>
  Date.now() - new Date(updatedAt).getTime() < 60 * 60 * 1000;

export const WorkspaceHome = ({ workspace: initialWorkspace, templateName }: WorkspaceHomeProps) => {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const base = `/w/${workspace.id}`;
  const canCreate = workspace.permissions.canCreateContent && workspace.status === "active";

  const sortedTasks = [...MOCK_TASKS].sort((a, b) => {
    const aOver = a.dueDate ? formatDueDate(a.dueDate).isOverdue : false;
    const bOver = b.dueDate ? formatDueDate(b.dueDate).isOverdue : false;
    if (aOver !== bOver) return aOver ? -1 : 1;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const handleUnarchive = () => {
    setWorkspace((w) => ({ ...w, status: "active" }));
    toast.success(`"${workspace.name}" unarchived`);
  };

  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto w-full">
      {/* Archived banner */}
      {workspace.status === "archived" && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <div
              className="h-9 w-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <Archive className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">This workspace is archived</p>
              <p className="text-xs text-stone-500 mt-0.5">
                All content is read-only. No new documents, tasks, or members can be added.
              </p>
            </div>
          </div>
          {workspace.permissions.canEditSettings && (
            <button
              type="button"
              onClick={handleUnarchive}
              className="h-8 px-3 rounded-lg border border-amber-300 bg-white text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors flex-shrink-0"
            >
              Unarchive
            </button>
          )}
        </div>
      )}

      <PageHeader
        variant="contextual"
        eyebrow="Workspace"
        title={workspace.name}
        description={workspace.description || undefined}
        icon={workspace.icon ?? "📁"}
        badges={
          <>
            <span
              className={cn(
                "text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border",
                typeBadge(workspace.type),
              )}
            >
              {workspace.type}
            </span>
            <span className="font-mono text-[10px] text-stone-500 tracking-wider uppercase px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200">
              {workspace.roleLabel}
            </span>
            {templateName && (
              <span
                className="font-mono text-[10px] text-teal-700 tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 inline-flex items-center gap-1"
                title={`Created from the ${templateName} template`}
              >
                <Sparkles className="h-2.5 w-2.5" />
                {templateName}
              </span>
            )}
          </>
        }
        actions={
          canCreate ? (
            <>
              <Link to={`${base}/documents/new`}>
                <button
                  type="button"
                  className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all duration-150 flex items-center gap-1.5 shadow-sm"
                >
                  <FilePlus className="h-4 w-4 text-stone-500" />
                  New doc
                </button>
              </Link>
              <Link to={`${base}/tasks/new`}>
                <button
                  type="button"
                  className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all duration-150 flex items-center gap-1.5 shadow-sm"
                >
                  <ListPlus className="h-4 w-4 text-stone-500" />
                  New task
                </button>
              </Link>
              {workspace.permissions.canEditSettings && (
                <Link to={`${base}/members`}>
                  <button
                    type="button"
                    className="h-9 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-medium text-white transition-colors duration-150 flex items-center gap-1.5 shadow-sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite
                  </button>
                </Link>
              )}
            </>
          ) : undefined
        }
        meta={
          <>
            <MetaStat icon={Users} value={workspace.memberCount} label="members" />
            <MetaDivider />
            <MetaStat icon={FileText} value={MOCK_DOCS.length} label="docs" />
            <MetaDivider />
            <MetaStat icon={CheckSquare} value={sortedTasks.length} label="my tasks" />
            {workspace.permissions.canEditSettings && (
              <>
                <MetaDivider />
                <Link
                  to={`${base}/settings`}
                  className="inline-flex items-center gap-1.5 text-stone-400 hover:text-teal-600 transition-colors"
                >
                  <Settings className="h-3 w-3" aria-hidden="true" />
                  Settings
                </Link>
              </>
            )}
          </>
        }
      />

      {/* Academic supervisor progress — only shown for academic workspaces */}
      {workspace.type === "academic" && workspace.status === "active" && (
        <WorkspaceAcademicProgress
          workspaceId={workspace.id}
          isSupervisorView={
            // OWNER and roles that can edit settings act as supervisors here
            workspace.permissions.canEditSettings
          }
        />
      )}

      {/* Asymmetric grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 mt-8">
        {/* LEFT — Documents */}
        <section aria-labelledby="recent-docs-heading">
          <SectionHeader
            id="recent-docs-heading"
            variant="primary"
            title="Recent documents"
            count={<CountChip value={MOCK_DOCS.length} />}
            action={
              <Link
                to={`${base}/documents`}
                className="text-[13px] font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                View all →
              </Link>
            }
          />

          <div className="rounded-xl border border-stone-200 bg-white p-3">
            {MOCK_DOCS.length === 0 ? (
              <EmptyDocs
                base={base}
                canCreate={canCreate}
                viewerOnly={!workspace.permissions.canCreateContent}
              />
            ) : (
              <ul className="divide-y divide-stone-100">
                {MOCK_DOCS.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      to={`${base}/documents/${doc.id}`}
                      className="group flex items-center gap-3 py-3 px-3 -mx-3 rounded-lg hover:bg-stone-50 transition-colors duration-150"
                    >
                      <div className="h-9 w-9 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-50 group-hover:border-teal-200 transition-colors duration-200">
                        <FileText
                          className="h-4 w-4 text-stone-400 group-hover:text-teal-600 transition-colors duration-200"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate group-hover:text-teal-700 transition-colors duration-200">
                          {doc.title}
                        </p>
                        <p className="text-xs text-stone-400 truncate mt-0.5">
                          {doc.folderPath || "Root"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isRecentlyEdited(doc.updatedAt) && (
                          <div
                            className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"
                            title="Recently edited"
                            aria-label="Recently edited"
                          />
                        )}
                        {doc.isLocked && (
                          <Lock
                            className="h-3.5 w-3.5 text-amber-500 flex-shrink-0"
                            aria-label={`Locked by ${doc.lockedBy?.fullName ?? "unknown"}`}
                          />
                        )}
                        {doc.status !== "draft" && (
                          <span
                            className={cn(
                              "text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border",
                              doc.status === "submitted" &&
                                "bg-amber-50 text-amber-600 border-amber-200",
                              doc.status === "changes_requested" &&
                                "bg-red-50 text-red-600 border-red-200",
                              doc.status === "approved" &&
                                "bg-emerald-50 text-emerald-600 border-emerald-200",
                              doc.status === "archived" &&
                                "bg-stone-100 text-stone-500 border-stone-200",
                            )}
                          >
                            {doc.status === "changes_requested"
                              ? "CHANGES"
                              : doc.status.toUpperCase()}
                          </span>
                        )}
                        <time
                          dateTime={doc.updatedAt}
                          title={fullDateTime(doc.updatedAt)}
                          className="font-mono text-[10px] text-stone-400 tracking-wider hidden sm:inline"
                        >
                          {relativeTime(doc.updatedAt)}
                        </time>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* RIGHT — Tasks + Activity */}
        <div className="lg:border-l lg:border-stone-100 lg:pl-8">
          {/* My tasks */}
          <section aria-labelledby="my-tasks-heading">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="my-tasks-heading"
                className="text-sm font-semibold text-stone-900 flex items-center gap-2"
              >
                My tasks
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-teal-50 border border-teal-200 text-[10px] font-mono font-semibold text-teal-700 flex items-center justify-center">
                  {sortedTasks.length}
                </span>
              </h2>
              <Link
                to={`${base}/tasks`}
                className="text-[13px] font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                View all →
              </Link>
            </div>

            {sortedTasks.length === 0 ? (
              <EmptySmall icon={CheckSquare} title="No tasks assigned" subtitle="You're all clear." />
            ) : (
              <ul>
                {sortedTasks.map((task) => {
                  const due = task.dueDate ? formatDueDate(task.dueDate) : null;
                  return (
                    <li key={task.id}>
                      <Link
                        to={`${base}/tasks/${task.id}`}
                        className="group flex items-start gap-3 py-3 px-3 -mx-3 rounded-lg hover:bg-stone-50 transition-colors duration-150"
                      >
                        <div
                          className={cn(
                            "w-1 self-stretch min-h-[40px] rounded-full flex-shrink-0",
                            task.priority === "urgent" && "bg-red-500",
                            task.priority === "high" && "bg-amber-500",
                            task.priority === "medium" && "bg-teal-500",
                            task.priority === "low" && "bg-stone-300",
                          )}
                          aria-hidden="true"
                        />
                        <span className="sr-only">Priority: {task.priority}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate group-hover:text-teal-700 transition-colors duration-150">
                            {task.title}
                          </p>
                          {due && (
                            <span
                              className={cn(
                                "text-[11px] font-medium flex items-center gap-1 mt-1",
                                due.isOverdue && "text-red-600",
                                due.isDueToday && "text-amber-600",
                                !due.isOverdue && !due.isDueToday && "text-stone-500",
                              )}
                            >
                              {due.isOverdue && (
                                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                              )}
                              {due.text}
                            </span>
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5",
                            task.status === "todo" && "bg-stone-100 text-stone-500",
                            task.status === "in_progress" &&
                              "bg-teal-50 text-teal-600 border border-teal-200",
                            task.status === "in_review" &&
                              "bg-amber-50 text-amber-600 border border-amber-200",
                          )}
                        >
                          {task.status === "todo" && "TODO"}
                          {task.status === "in_progress" && "PROGRESS"}
                          {task.status === "in_review" && "REVIEW"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Separator */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-stone-100" />
            <span className="font-mono text-[9px] text-stone-400 tracking-[0.15em] uppercase">
              Recent activity
            </span>
            <div className="h-px flex-1 bg-stone-100" />
          </div>

          {/* Activity */}
          <section aria-labelledby="activity-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="activity-heading" className="sr-only">
                Recent activity
              </h2>
              <Link
                to={`${base}/activity`}
                className="text-[13px] font-medium text-teal-600 hover:text-teal-700 transition-colors ml-auto"
              >
                View all →
              </Link>
            </div>

            {MOCK_EVENTS.length === 0 ? (
              <EmptySmall
                icon={ActivityIcon}
                title="No activity yet"
                subtitle="Updates from your team will appear here."
              />
            ) : (
              <ol>
                {MOCK_EVENTS.map((event, idx) => {
                  const showConnector = idx < MOCK_EVENTS.length - 1;
                  return (
                    <li key={event.id} className="relative">
                      {showConnector && (
                        <div
                          className="absolute left-[15px] top-8 bottom-0 w-px bg-stone-100"
                          aria-hidden="true"
                        />
                      )}
                      <div className="flex gap-3 pb-5">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border-2 border-white shadow-sm"
                          style={{
                            backgroundColor: getAvatarColor(event.actor.id),
                            color: "white",
                          }}
                          aria-hidden="true"
                        >
                          {getInitials(event.actor.fullName, 1)}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-[13px] text-stone-600 leading-relaxed">
                            <span className="font-medium text-stone-900">
                              {event.actor.fullName}
                            </span>{" "}
                            {event.action}
                          </p>
                          {event.resource && (
                            <p className="text-[13px] text-stone-500 mt-0.5">
                              <span className="font-medium text-stone-700">
                                "{event.resource.title}"
                              </span>
                            </p>
                          )}
                          <time
                            dateTime={event.createdAt}
                            title={fullDateTime(event.createdAt)}
                            className="font-mono text-[10px] text-stone-400 tracking-wider mt-1 block"
                          >
                            {relativeTime(event.createdAt)}
                          </time>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

const EmptyDocs = ({
  base,
  canCreate,
  viewerOnly,
}: {
  base: string;
  canCreate: boolean;
  viewerOnly: boolean;
}) => (
  <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/50 py-10 text-center">
    <div className="h-10 w-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto">
      <FileText className="h-5 w-5 text-stone-400" aria-hidden="true" />
    </div>
    <h3 className="text-sm font-semibold text-stone-900 mt-4">No documents yet</h3>
    <p className="text-sm text-stone-500 mt-1.5 max-w-xs mx-auto">
      {viewerOnly
        ? "No documents have been created in this workspace yet."
        : "Create your first document to start collaborating."}
    </p>
    {canCreate && (
      <Link to={`${base}/documents/new`}>
        <button
          type="button"
          className="mt-4 h-8 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5 mx-auto shadow-sm"
        >
          <FilePlus className="h-3.5 w-3.5" />
          New document
        </button>
      </Link>
    )}
  </div>
);

const EmptySmall = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof CheckSquare;
  title: string;
  subtitle: string;
}) => (
  <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50/50 py-8 text-center">
    <div className="h-9 w-9 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto">
      <Icon className="h-4 w-4 text-stone-400" aria-hidden="true" />
    </div>
    <h3 className="text-sm font-semibold text-stone-900 mt-3">{title}</h3>
    <p className="text-xs text-stone-500 mt-1 max-w-[200px] mx-auto">{subtitle}</p>
  </div>
);
