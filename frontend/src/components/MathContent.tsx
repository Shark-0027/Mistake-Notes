import { Component, type ErrorInfo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

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
      return (
        <div className="formula-fallback" role="status">
          <strong>公式渲染失败，以下为原始内容：</strong>
          <pre>{this.props.source}</pre>
        </div>
      );
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
  return (
    <FormulaErrorBoundary source={source}>
      <div className={`math-content ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[[rehypeKatex, { throwOnError: true, strict: false }]]}
        >
          {source}
        </ReactMarkdown>
      </div>
    </FormulaErrorBoundary>
  );
}

