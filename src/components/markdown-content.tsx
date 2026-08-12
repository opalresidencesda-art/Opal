import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { sanitizeMarkdown } from "@/lib/markdown";

const nestedHeadings: Components = {
  h2: ({ children }) => <h3>{children}</h3>,
  h3: ({ children }) => <h4>{children}</h4>,
};

export function MarkdownContent({ children, nested = false }: { children: string; nested?: boolean }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown components={nested ? nestedHeadings : undefined} remarkPlugins={[remarkGfm]} skipHtml>
        {sanitizeMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}
