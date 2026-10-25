import React from "react";

interface FormattedAiResponseProps {
  text: string;
  className?: string;
}

/**
 * Parses inline markdown tokens:
 * - **bold** -> <strong>
 * - *italic* -> <em>
 * - `code`   -> <code>
 */
function renderInline(text: string): React.ReactNode[] {
  // If there's an odd number of double asterisks (e.g. mid-typewriter), auto-close
  let sanitized = text;
  const boldMatches = sanitized.match(/\*\*/g);
  if (boldMatches && boldMatches.length % 2 === 1) {
    sanitized += "**";
  }

  // Regex splitting by:
  // 1) **bold**
  // 2) *italic* (not followed or preceded by another asterisk)
  // 3) `code`
  const tokenRegex = /(\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*)|`[^`]+`)/g;
  const parts = sanitized.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-inherit">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2 && !part.startsWith("**")) {
      return (
        <em key={index} className="italic text-inherit">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1 py-0.5 rounded bg-black/5 font-mono text-[12px] text-inherit"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Formats multi-paragraph and list structures from AI responses into
 * accessible, styled React elements without requiring heavy external dependencies.
 */
export function FormattedAiResponse({ text, className = "" }: FormattedAiResponseProps) {
  if (!text) return null;

  // Split into paragraph blocks by double newline
  const blocks = text.split(/\n{2,}/);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {blocks.map((block, blockIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const lines = trimmed.split("\n");

        // Check if all or most lines are bullet points (* or - or •)
        const isBulletList = lines.every((l) => /^\s*([*\-•])\s+/.test(l));
        if (isBulletList) {
          return (
            <ul key={blockIdx} className="space-y-1.5 my-1.5 pl-4 list-disc marker:text-slate-400">
              {lines.map((line, lineIdx) => {
                const itemContent = line.replace(/^\s*([*\-•])\s+/, "");
                return (
                  <li key={lineIdx} className="leading-relaxed pl-0.5">
                    {renderInline(itemContent)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Check if numbered list (1. 2. 3.)
        const isNumberedList = lines.every((l) => /^\s*\d+\.\s+/.test(l));
        if (isNumberedList) {
          return (
            <ol key={blockIdx} className="space-y-1.5 my-1.5 pl-4 list-decimal marker:text-slate-400">
              {lines.map((line, lineIdx) => {
                const itemContent = line.replace(/^\s*\d+\.\s+/, "");
                return (
                  <li key={lineIdx} className="leading-relaxed pl-0.5">
                    {renderInline(itemContent)}
                  </li>
                );
              })}
            </ol>
          );
        }

        // Check for markdown headings (# or ## or ###)
        if (/^#{1,3}\s+/.test(trimmed)) {
          const headingText = trimmed.replace(/^#{1,3}\s+/, "");
          return (
            <h4 key={blockIdx} className="font-bold text-inherit tracking-tight text-sm mt-2 mb-1">
              {renderInline(headingText)}
            </h4>
          );
        }

        // Regular paragraph with single line-break handling
        return (
          <p key={blockIdx} className="leading-relaxed">
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {renderInline(line)}
                {lineIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
