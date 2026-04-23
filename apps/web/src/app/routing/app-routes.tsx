/**
 * Central route table for the SPA.
 *
 * Public auth routes (login, register, forgot, reset, verify) bounce
 * authed users back to the app via `RedirectIfAuthed`. Every protected
 * surface is wrapped in `RequireAuth`. Admin pages additionally pass
 * through `AdminGuard`.
 */
import { Route, Routes } from "react-router-dom";
import { RequireAuth, RedirectIfAuthed } from "./auth-guards";
import { GlobalShortcuts } from "@/app/shell/global-shortcuts";
import { ShortcutHelpDialog } from "@/app/shell/shortcut-help-dialog";

// Landing & auth
import Index from "@/features/landing/pages/Index";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import ResetPassword from "@/features/auth/pages/ResetPassword";
import VerifyEmail from "@/features/auth/pages/VerifyEmail";
import AcceptInvite from "@/features/auth/pages/AcceptInvite";

// Core product slices
import Dashboard from "@/features/dashboard/pages/Dashboard";
import Workspaces from "@/features/workspace/pages/Workspaces";
import CreateWorkspace from "@/features/workspace/pages/CreateWorkspace";
import WorkspaceHome from "@/features/workspace/pages/WorkspaceHome";
import WorkspaceComingSoon from "@/features/workspace/pages/WorkspaceComingSoon";
import WorkspaceSettings from "@/features/workspace/pages/WorkspaceSettings";
import Documents from "@/features/documents/pages/Documents";
import NewDocument from "@/features/documents/pages/NewDocument";
import DocumentEditor from "@/features/documents/pages/DocumentEditor";
import DocumentHistory from "@/features/documents/pages/DocumentHistory";
import Tasks from "@/features/tasks/pages/Tasks";
import TasksList from "@/features/tasks/pages/TasksList";
import TaskDetail from "@/features/tasks/pages/TaskDetail";

// Governance + support slices
import Members from "@/features/members/pages/Members";
import Activity from "@/features/activity/pages/Activity";
import Notifications from "@/features/notifications/pages/Notifications";
import Settings from "@/features/settings/pages/Settings";
import SettingsProfile from "@/features/settings/pages/SettingsProfile";
import SettingsPassword from "@/features/settings/pages/SettingsPassword";
import SettingsNotifications from "@/features/settings/pages/SettingsNotifications";
import SettingsAppearance from "@/features/settings/pages/SettingsAppearance";
import Files from "@/features/files/pages/Files";
import Templates from "@/features/templates/pages/Templates";
import Analytics from "@/features/analytics/pages/Analytics";

// Admin
import AdminDashboard from "@/features/admin/pages/AdminDashboard";
import AdminUsers from "@/features/admin/pages/AdminUsers";
import AdminUserDetail from "@/features/admin/pages/AdminUserDetail";
import AdminWorkspaces from "@/features/admin/pages/AdminWorkspaces";
import AdminWorkspaceDetail from "@/features/admin/pages/AdminWorkspaceDetail";
import AdminAudit from "@/features/admin/pages/AdminAudit";
import AdminSettings from "@/features/admin/pages/AdminSettings";

// Reviewer
import ReviewQueue from "@/features/review/pages/ReviewQueue";

// Catch-all
import NotFound from "@/pages/NotFound";

const protect = (el: JSX.Element) => <RequireAuth>{el}</RequireAuth>;
const guestOnly = (el: JSX.Element) => <RedirectIfAuthed>{el}</RedirectIfAuthed>;

export function AppRoutes() {
  return (
    <>
      <GlobalShortcuts />
      <ShortcutHelpDialog />
      <Routes>
      {/* Landing & auth */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={guestOnly(<Login />)} />
      <Route path="/register" element={guestOnly(<Register />)} />
      <Route path="/forgot-password" element={guestOnly(<ForgotPassword />)} />
      <Route path="/reset-password/:token" element={guestOnly(<ResetPassword />)} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/invite/:token" element={<AcceptInvite />} />

      {/* App shell */}
      <Route path="/dashboard" element={protect(<Dashboard />)} />
      <Route path="/workspaces" element={protect(<Workspaces />)} />
      <Route path="/workspaces/new" element={protect(<CreateWorkspace />)} />
      <Route path="/notifications" element={protect(<Notifications />)} />
      <Route path="/review" element={protect(<ReviewQueue />)} />

      {/* User settings */}
      <Route path="/settings" element={protect(<Settings />)} />
      <Route path="/settings/profile" element={protect(<SettingsProfile />)} />
      <Route path="/settings/password" element={protect(<SettingsPassword />)} />
      <Route path="/settings/notifications" element={protect(<SettingsNotifications />)} />
      <Route path="/settings/appearance" element={protect(<SettingsAppearance />)} />

      {/* Workspace */}
      <Route path="/w/:workspaceId" element={protect(<WorkspaceHome />)} />
      <Route path="/w/:workspaceId/documents" element={protect(<Documents />)} />
      <Route path="/w/:workspaceId/documents/new" element={protect(<NewDocument />)} />
      <Route path="/w/:workspaceId/documents/:documentId" element={protect(<DocumentEditor />)} />
      <Route
        path="/w/:workspaceId/documents/:documentId/history"
        element={protect(<DocumentHistory />)}
      />
      <Route path="/w/:workspaceId/tasks" element={protect(<Tasks />)} />
      <Route path="/w/:workspaceId/tasks/list" element={protect(<TasksList />)} />
      <Route path="/w/:workspaceId/tasks/:taskId" element={protect(<TaskDetail />)} />
      <Route
        path="/w/:workspaceId/tasks/new"
        element={protect(
          <WorkspaceComingSoon
            title="New task"
            description="Quick task creation lives inside the Tasks board — open it from the sidebar."
          />,
        )}
      />
      <Route path="/w/:workspaceId/members" element={protect(<Members />)} />
      <Route path="/w/:workspaceId/activity" element={protect(<Activity />)} />
      <Route path="/w/:workspaceId/files" element={protect(<Files />)} />
      <Route path="/w/:workspaceId/analytics" element={protect(<Analytics />)} />
      <Route path="/w/:workspaceId/templates" element={protect(<Templates />)} />
      <Route path="/w/:workspaceId/settings" element={protect(<WorkspaceSettings />)} />
      <Route path="/w/:workspaceId/settings/members" element={protect(<WorkspaceSettings />)} />

      {/* Admin (RequireAuth + AdminGuard inside each page) */}
      <Route path="/admin" element={protect(<AdminDashboard />)} />
      <Route path="/admin/users" element={protect(<AdminUsers />)} />
      <Route path="/admin/users/:userId" element={protect(<AdminUserDetail />)} />
      <Route path="/admin/workspaces" element={protect(<AdminWorkspaces />)} />
      <Route path="/admin/workspaces/:workspaceId" element={protect(<AdminWorkspaceDetail />)} />
      <Route path="/admin/audit" element={protect(<AdminAudit />)} />
      <Route path="/admin/settings" element={protect(<AdminSettings />)} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
