import { useState } from "react";
import {
  MoreHorizontal,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FolderProps = {
  type: "folder";
  name: string;
  onNewDoc: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
};

type DocumentProps = {
  type: "document";
  name: string;
  onDelete: () => void;
};

export const TreeContextMenu = (props: FolderProps | DocumentProps) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-6 w-6 rounded flex items-center justify-center text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
          aria-label={`Actions for ${props.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-white border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {props.type === "folder" && (
          <>
            <DropdownMenuItem
              onSelect={() => props.onNewDoc()}
              className="text-sm flex items-center gap-2 cursor-pointer"
            >
              <FilePlus className="h-4 w-4 text-stone-500" />
              New document here
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => props.onNewFolder()}
              className="text-sm flex items-center gap-2 cursor-pointer"
            >
              <FolderPlus className="h-4 w-4 text-stone-500" />
              New subfolder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => props.onRename()}
              className="text-sm flex items-center gap-2 cursor-pointer"
            >
              <Pencil className="h-4 w-4 text-stone-500" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onSelect={() => props.onDelete()}
          className="text-sm flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
          Delete {props.type}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
