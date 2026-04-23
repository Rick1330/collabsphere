import { forwardRef } from "react";
import { EditorContent as TiptapEditorContent, type Editor } from "@tiptap/react";

interface EditorContentAreaProps {
  editor: Editor | null;
  /** Optional content rendered inside the writing column (e.g. inline anchor highlights). */
  children?: React.ReactNode;
}

export const EditorContentArea = forwardRef<HTMLDivElement, EditorContentAreaProps>(
  ({ editor, children }, ref) => (
    <div ref={ref} className="flex-1 overflow-y-auto bg-white relative">
      <div className="max-w-3xl mx-auto px-6 py-8 md:px-10 md:py-12 lg:px-16 lg:py-16 relative">
        <TiptapEditorContent editor={editor} />
        {children}
      </div>
    </div>
  ),
);
EditorContentArea.displayName = "EditorContentArea";
