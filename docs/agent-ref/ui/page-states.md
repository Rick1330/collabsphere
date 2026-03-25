# UI Page States (agent-ref)

## Purpose
Provide an execution-focused reference for the mandatory UI page state model (Loading, Empty, Error, Loaded) and the exact behaviors required across CollabSphere.

## Canonical Sources
- `docs/spec/03-information-architecture/03.7-page-states.md` — §3.7 Page States, §3.7.1–§3.7.3
- `docs/spec/03-information-architecture/03.2-route-map.md` — route contexts (public/global/workspace/admin)
- `docs/spec/03-information-architecture/03.10-accessibility.md` — accessibility requirements for state UI

## Domain Sources
- None (spec-only sources for this file)

## Scope
- The four required UI states for every page and data section.
- Canonical empty state messages and CTA visibility rules.
- Error state patterns and actions by status.
- RequestId visibility requirements for error reporting.

## Required Rules / Contract

### Mandatory states (no exceptions)
All pages and data-loading sections MUST implement exactly four states:
1. **Loading**
2. **Empty**
3. **Error**
4. **Loaded**

### Loading (MUST)
- Use skeleton screens matching the content layout.
- Never show a spinner alone.
- Skeletons must mirror final layout to avoid visual “jumping.”

### Empty (MUST)
- Show illustration + descriptive message + primary CTA (if applicable).
- Message must explain what would appear and guide next action.
- CTA visibility depends on role.

#### Canonical empty states (selected)
- **Dashboard — Recent Workspaces**:  
  “You haven't joined any workspaces yet. Create one or ask your team lead for an invitation.”  
  CTA: [Create Workspace] (All users)
- **Document List**:  
  “No documents yet. Create your first document to start collaborating.”  
  CTA: [Create Document] (Member+)  
  Viewer variant: “No documents have been created in this workspace yet.” (no CTA)
- **Task Board**:  
  “No tasks yet. Create a task to start tracking your team's work.”  
  CTA: [Create Task] (Member+)  
  Viewer variant: “No tasks have been created in this workspace yet.” (no CTA)
- **Members List**:  
  “No members besides you. Invite your team to start collaborating.”  
  CTA: [Invite Members] (Admin+)
- **Activity Feed**:  
  “No activity recorded yet. Activity will appear here as your team works.” (no CTA)
- **Files**:  
  “No files uploaded yet. Upload files or attach them to documents and tasks.”  
  CTA: [Upload File] (Member+)
- **Notifications**:  
  “All caught up! You have no notifications.” (no CTA)
- **Search Results**:  
  “No results found for '[query]'. Try different keywords or check your spelling.” (no CTA)
- **Comments**:  
  “No comments yet. Start a discussion.” (focus on comment input)

### Error (MUST)
- Show error icon + message + retry button.
- Include `requestId` in a “Report Issue” link when available.
- Never show stack traces or technical details.

#### Error patterns by type
- **Network offline**: “You're offline. Please check your internet connection.” → [Retry]
- **500 Server error**: “Something went wrong. Please try again.” → [Retry] + RequestId in support link
- **404 Not found**: “This page doesn't exist or has been moved.” → [Go to Dashboard]
- **403 Not authorized**: “You don't have permission to access this page.” → [Go to Dashboard]
- **401 Session expired**: “Your session has expired. Please sign in again.” → [Sign In]
- **429 Rate limited**: “You're making requests too quickly. Please wait a moment.” → auto-retry with countdown
- **Workspace not found**: “This workspace doesn't exist or you're not a member.” → [Go to Workspaces]
- **Document not found**: “This document doesn't exist or has been deleted.” → [Go to Documents]

### Loaded (MUST)
- Render normal content state.

## Edge Cases / Failure Modes
- Page-level errors must not leak sensitive details or cross-workspace data.
- Retry actions must re-run the original request with current auth context.
- If user loses access between loads, transition to **Error** (403) and follow the canonical pattern.

## Validation or Testing Notes
- Every route and data section must be tested across all four states.
- Verify empty state CTAs are role-gated (Viewer vs Member+, Admin+).
- Ensure RequestId is surfaced for server errors.
- Confirm accessibility (focus, ARIA, keyboard) applies to state-specific UI elements.

## Related Files / Domains
- `docs/agent-ref/ui/routes.md`
- `docs/agent-ref/ui/screen-specs.md`
- `docs/agent-ref/ui/accessibility.md`
- `docs/agent-ref/ui/responsive-rules.md`
- `docs/agent-ref/rules/error-codes.md`


