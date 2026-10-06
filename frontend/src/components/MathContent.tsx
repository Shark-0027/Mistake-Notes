import { Component, type ErrorInfo, type ReactNode } from "react";
import katex from "katex";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

function normalizeDisplayMath(source: string): string {
  return source
    .replace(/\$\$([^\s])/g, "$$\n$1")
    .replace(/([^\s])\$\$/g, "$1\n$$");
}

function validateMath(source: string): void {
  let index = 0;
  while (index < source.length) {
    if (source.startsWith("$$", index)) {
      const end = source.indexOf("$$", index + 2);
      if (end === -1) throw new Error("Unclosed display formula");
      katex.renderToString(source.slice(index + 2, end), {
        displayMode: true,
        throwOnError: true,
        strict: false,
        trust: false,
      });
      index = end + 2;
      continue;
    }
    if (source[index] === "$") {
      let end = index + 1;
      while (end < source.length) {
        if (source[end] === "$" && source[end - 1] !== "\\") break;
        end += 1;
      }
      if (end >= source.length) throw new Error("Unclosed inline formula");
      katex.renderToString(source.slice(index + 1, end), {
        displayMode: false,
        throwOnError: true,
        strict: false,
        trust: false,
      });
      index = end + 1;
      continue;
    }
    index += 1;
  }
}

function FormulaFallback({ source }: { source: string }) {
  return (
    <div className="formula-fallback" role="status">
      <strong>公式渲染失败，以下为原始内容：</strong>
      <pre>{source}</pre>
    </div>
  );
}

class FormulaErrorBoundary extends Component<
  { source: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Formula rendering failed", error, info);
  }

  render() {
    if (this.state.failed) {
      return <FormulaFallback source={this.props.source} />;
    }
    return this.props.children;
  }
}

export function MathContent({
  source,
  className = "",
}: {
  source: string;
  className?: string;
}) {
  let prepared: string;
  try {
    prepared = normalizeDisplayMath(source);
    validateMath(prepared);
  } catch {
    return <FormulaFallback source={source} />;
  }

  return (
    <FormulaErrorBoundary source={source}>
      <div className={`math-content ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[[rehypeKatex, { throwOnError: true, strict: false }]]}
        >
          {prepared}
        </ReactMarkdown>
      </div>
    </FormulaErrorBoundary>
  );
}
