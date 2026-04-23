import { Fragment } from "react";
import type { CommentNode } from "@/lib/mock-comments";

/**
 * Render a structured comment body (text + mention chips) safely. We never
 * inject raw HTML — only the text fragments and styled mention pills.
 */
export const DocumentCommentBody = ({ body }: { body: CommentNode[] }) => (
  <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap break-words">
    {body.map((node, i) => {
      if (node.type === "mention") {
        return (
          <span
            key={i}
            className="inline-flex items-center px-1.5 py-px rounded bg-teal-50 text-teal-700 font-medium text-[13px] mx-px"
          >
            @{node.display.split(" ")[0]}
          </span>
        );
      }
      return <Fragment key={i}>{node.text}</Fragment>;
    })}
  </div>
);
