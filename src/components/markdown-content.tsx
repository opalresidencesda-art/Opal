import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sanitizeMarkdown } from "@/lib/markdown";

export function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
        {sanitizeMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}
