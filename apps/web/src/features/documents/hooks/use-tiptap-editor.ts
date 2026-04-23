import { useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

interface UseTiptapEditorProps {
  content: string;
  editable: boolean;
  onUpdate?: (html: string) => void;
}

export function useTiptapEditor({
  content,
  editable,
  onUpdate,
}: UseTiptapEditorProps): Editor | null {
  return useEditor(
    {
      extensions: [
        (StarterKit as any).configure({
          heading: { levels: [1, 2, 3, 4, 5, 6] },
          codeBlock: {
            HTMLAttributes: {
              class:
                "not-prose rounded-lg bg-stone-900 text-stone-100 p-4 text-sm font-mono overflow-x-auto",
            },
          },
        }),
        Underline as any,
        (Link as any).configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-teal-600 hover:underline cursor-pointer",
          },
        }),
        (Placeholder as any).configure({
          placeholder: ({ node }: any) => {
            if (node.type.name === "heading") return "Heading";
            return "Start writing, or press / for commands…";
          },
        }),
      ],
      content,
      editable,
      autofocus: editable ? "end" : false,
      onUpdate: ({ editor: ed }) => onUpdate?.(ed.getHTML()),
      editorProps: {
        attributes: {
          class: [
            "tiptap",
            "prose prose-stone max-w-none",
            "prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-stone-900",
            "prose-p:leading-relaxed prose-p:text-stone-700",
            "prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline",
            "prose-strong:text-stone-900",
            "prose-code:text-teal-700 prose-code:bg-stone-100",
            "prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-medium",
            "prose-code:before:content-none prose-code:after:content-none",
            "prose-blockquote:border-l-4 prose-blockquote:border-l-teal-500 prose-blockquote:not-italic",
            "prose-blockquote:text-stone-600 prose-blockquote:font-normal",
            "prose-pre:bg-stone-900 prose-pre:text-stone-100 prose-pre:rounded-lg",
            "prose-li:marker:text-stone-400",
            "prose-hr:border-stone-200",
            "focus:outline-none min-h-[60vh]",
          ].join(" "),
        },
      },
    },
    [editable, content === "" ? "empty" : "filled"],
  );
}
