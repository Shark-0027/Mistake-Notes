import { Component, type ErrorInfo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

function normalizeDisplayMath(source: string): string {
  return source
    .replace(/\$\$([^\s])/g, "$$\n$1")
    .replace(/([^\s])\$\$/g, "$1\n$$");
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
  const prepared = normalizeDisplayMath(source);

  return (
    <FormulaErrorBoundary source={source}>
      <div className={`math-content ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[
            [
              rehypeKatex,
              {
                throwOnError: false,
                strict: false,
                trust: false,
                errorColor: "#b91c1c",
              },
            ],
          ]}
        >
          {prepared}
        </ReactMarkdown>
      </div>
    </FormulaErrorBoundary>
  );
}