/**
 * Workspace labels API adapter.
 *
 * Wraps the curated label vocabulary used by tasks. The presentational
 * helpers (`getLabelClasses`, `getLabelName`) are pure functions over the
 * label data and stay re-exported here so components do not import from
 * the mock module directly.
 */
export {
  getWorkspaceLabels,
  findLabel,
  getLabelClasses,
  getLabelName,
  type WorkspaceLabel,
} from "@/features/tasks/mocks/labels";
