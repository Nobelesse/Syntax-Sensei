import * as React from 'react';
import { Children, isValidElement, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Only interpret model output as Markdown. Raw HTML is never parsed or mounted.
 * External references are permitted only when they are HTTP(S) URLs.
 */
function textFromNodes(value: ReactNode): string {
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textFromNodes).join('');
  if (isValidElement<{ children?: ReactNode }>(value)) return textFromNodes(value.props.children);
  return '';
}

function copyText(value: string): void {
  if (!navigator.clipboard?.writeText) return;
  void navigator.clipboard.writeText(value).catch(() => {
    // Clipboard permissions vary by VS Code/webview version; keep the answer usable.
  });
}

function CodePanel({ children }: { children?: ReactNode }) {
  const codeChild = Children.toArray(children).find(child => isValidElement(child));
  const element = isValidElement<{ className?: string; children?: ReactNode }>(codeChild) ? codeChild : null;
  const code = textFromNodes(element?.props.children ?? children).replace(/\n$/, '');
  const language = element?.props.className?.match(/language-([\w+#.-]+)/i)?.[1] ?? 'Code';
  return <div className="sensei-code-panel">
    <div className="sensei-code-header">
      <span className="sensei-code-lang">{language}</span>
      <button type="button" className="sensei-copy-code" onClick={() => copyText(code)} aria-label={`Copy ${language} code`}>Copy code</button>
    </div>
    <pre>{children}</pre>
  </div>;
}

export default function MarkdownAnswer({ content }: { content: string }) {
  return <div className="sensei-answer">
    <div className="sensei-answer-toolbar">
      <span>FORMATTED EXPLANATION</span>
      <button type="button" className="sensei-copy-answer" onClick={() => copyText(content)}>Copy answer</button>
    </div>
    <div className="sensei-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          pre: ({ children }) => <CodePanel>{children}</CodePanel>,
          // Ollama may output markdown images or links; do not fetch images in the webview.
          img: () => null,
          table: ({ children }) => <div className="sensei-table-scroll"><table>{children}</table></div>,
          a: ({ href, children }) => href && /^https?:\/\//i.test(href)
            ? <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>
            : <span>{children}</span>,
        }}
      >{content}</ReactMarkdown>
    </div>
  </div>;
}
