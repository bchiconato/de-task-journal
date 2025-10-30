/**
 * @fileoverview Editor de código com paleta VS Code Dark Modern para a seção "Code implementation".
 * @component CodeImplementationEditor
 * @example
 *   <CodeImplementationEditor value={code} onChange={setCode} />
 * @param {{ value: string, onChange: (v:string)=>void, language?: string, minHeight?: number, placeholder?: string }} props
 * @returns {JSX.Element}
 */
import React, { forwardRef } from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import "../styles/vscode-dark-modern-prism.css";
import "prismjs";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/plugins/match-braces/prism-match-braces";
import "prismjs/plugins/highlight-keywords/prism-highlight-keywords";
import "prismjs/plugins/match-braces/prism-match-braces.css";

export const CodeImplementationEditor = forwardRef(function CodeImplementationEditor(
  { value, onChange, language = "jsx", minHeight = 240, placeholder, ...rest },
  ref
) {
  return (
    <div className="w-tc-editor-var">
      <CodeEditor
        ref={ref}
        value={value}
        language={language}
        placeholder={placeholder}
        data-color-mode="dark"
        className="code-impl match-braces rainbow-braces"
        padding={16}
        minHeight={minHeight}
        onChange={(e) => onChange(e.target.value)}
        style={{
          backgroundColor: "#1F1F1F",
          color: "#CCCCCC",
          fontSize: 14,
          fontFamily:
            "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
        }}
        {...rest}
      />
    </div>
  );
});
