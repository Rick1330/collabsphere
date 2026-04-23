import { useEffect } from "react";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import { CreateWorkspaceWizard } from "@/features/workspace/components/create-wizard";
import { useCommandPalette } from "@/hooks/use-command-palette";

const MOCK_USER = { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" };

const CreateWorkspace = () => {
  const palette = useCommandPalette();

  useEffect(() => {
    document.title = "Create workspace — CollabSphere";
  }, []);

  return (
    <div className="app-light min-h-screen flex flex-col">
      <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />
      <main className="flex-1 min-w-0">
        <CreateWorkspaceWizard />
      </main>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

export default CreateWorkspace;
