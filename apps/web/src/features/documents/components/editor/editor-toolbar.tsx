import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  MoreHorizontal,
  Quote,
  Redo,
  Strikethrough,
  TerminalSquare,
  Underline as UnderlineIcon,
  Undo,
  type LucideIcon,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor | null;
  isReadOnly: boolean;
}

interface ToolbarBtnProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ToolbarBtn = ({ icon: Icon, label, isActive, onClick, disabled }: ToolbarBtnProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    aria-pressed={isActive}
    title={label}
    className={cn(
      "h-7 w-7 rounded-md flex items-center justify-center transition-colors duration-100",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500/40",
      isActive
        ? "text-teal-700 bg-teal-50"
        : "text-stone-400 hover:text-stone-700 hover:bg-stone-100",
      disabled && "text-stone-300 cursor-not-allowed hover:bg-transparent hover:text-stone-300",
    )}
  >
    <Icon className="h-4 w-4" />
  </button>
);

const ToolbarSep = () => (
  <div className="w-px h-4 bg-stone-200 mx-1 flex-shrink-0" aria-hidden="true" />
);

export const EditorToolbar = ({ editor, isReadOnly }: EditorToolbarProps) => {
  const handleInsertLink = () => {
    if (!editor) return;
    const previousUrl = (editor.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt("Enter URL:", previousUrl);
    if (url === null) return;
    if (url === "") {
      (editor.chain().focus().extendMarkRange("link") as any).unsetLink().run();
      return;
    }
    (editor.chain().focus().extendMarkRange("link") as any).setLink({ href: url }).run();
  };

  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor?.isActive(name, attrs) ?? false;

  return (
    <div
      role="toolbar"
      aria-label="Editor toolbar"
      className="flex items-center gap-0.5 px-4 py-1.5 border-b border-stone-100 bg-white flex-shrink-0 overflow-x-auto"
    >
      {/* Desktop toolbar */}
      <div className="hidden md:flex items-center gap-0.5">
        <ToolbarBtn
          icon={Bold}
          label="Bold (⌘B)"
          isActive={isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={Italic}
          label="Italic (⌘I)"
          isActive={isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={UnderlineIcon}
          label="Underline (⌘U)"
          isActive={isActive("underline")}
          onClick={() => (editor?.chain().focus() as any)?.toggleUnderline().run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={Strikethrough}
          label="Strikethrough (⌘⇧X)"
          isActive={isActive("strike")}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          disabled={isReadOnly}
        />

        <ToolbarSep />

        <ToolbarBtn
          icon={Heading1}
          label="Heading 1 (⌘⌥1)"
          isActive={isActive("heading", { level: 1 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={Heading2}
          label="Heading 2 (⌘⌥2)"
          isActive={isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={Heading3}
          label="Heading 3 (⌘⌥3)"
          isActive={isActive("heading", { level: 3 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={isReadOnly}
        />

        <ToolbarSep />

        <ToolbarBtn
          icon={List}
          label="Bullet list (⌘⇧8)"
          isActive={isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={ListOrdered}
          label="Ordered list (⌘⇧7)"
          isActive={isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={Quote}
          label="Blockquote (⌘⇧9)"
          isActive={isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          disabled={isReadOnly}
        />

        <ToolbarSep />

        <ToolbarBtn
          icon={Code}
          label="Inline code (⌘E)"
          isActive={isActive("code")}
          onClick={() => editor?.chain().focus().toggleCode().run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={TerminalSquare}
          label="Code block"
          isActive={isActive("codeBlock")}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={Link2}
          label="Insert link (⌘⇧K)"
          isActive={isActive("link")}
          onClick={handleInsertLink}
          disabled={isReadOnly}
        />

        <ToolbarSep />

        <ToolbarBtn
          icon={Undo}
          label="Undo (⌘Z)"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={isReadOnly || !editor?.can().undo()}
        />
        <ToolbarBtn
          icon={Redo}
          label="Redo (⌘⇧Z)"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={isReadOnly || !editor?.can().redo()}
        />
      </div>

      {/* Mobile toolbar: 6 priority buttons + overflow */}
      <div className="flex md:hidden items-center gap-0.5">
        <ToolbarBtn
          icon={Bold}
          label="Bold"
          isActive={isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={Italic}
          label="Italic"
          isActive={isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={Heading2}
          label="Heading 2"
          isActive={isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={List}
          label="Bullet list"
          isActive={isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={Code}
          label="Inline code"
          isActive={isActive("code")}
          onClick={() => editor?.chain().focus().toggleCode().run()}
          disabled={isReadOnly}
        />
        <ToolbarBtn
          icon={Link2}
          label="Link"
          isActive={isActive("link")}
          onClick={handleInsertLink}
          disabled={isReadOnly}
        />

        <ToolbarSep />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-7 w-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-100 disabled:text-stone-300 disabled:hover:bg-transparent"
              disabled={isReadOnly}
              aria-label="More formatting options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => (editor?.chain().focus() as any)?.toggleUnderline().run()}>
              <UnderlineIcon className="h-4 w-4 mr-2" /> Underline
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleStrike().run()}>
              <Strikethrough className="h-4 w-4 mr-2" /> Strikethrough
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="h-4 w-4 mr-2" /> Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="h-4 w-4 mr-2" /> Heading 3
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="h-4 w-4 mr-2" /> Ordered list
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
              <Quote className="h-4 w-4 mr-2" /> Blockquote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
              <TerminalSquare className="h-4 w-4 mr-2" /> Code block
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor?.chain().focus().undo().run()}>
              <Undo className="h-4 w-4 mr-2" /> Undo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().redo().run()}>
              <Redo className="h-4 w-4 mr-2" /> Redo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
