/**
 * High-contrast dark theme code editor.
 * Dark background with bright text, stronger contrast for headings and bold.
 * @component CodeImplementationEditor
 * @param {{ value: string, onChange: (v:string)=>void, language?: string, minHeight?: number, placeholder?: string, padding?: number }} props
 * @returns {JSX.Element}
 */
import React, { forwardRef } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import '../styles/vscode-dark-modern-prism.css';
import 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/plugins/match-braces/prism-match-braces';
import 'prismjs/plugins/match-braces/prism-match-braces.css';

export const CodeImplementationEditor = forwardRef(
  function CodeImplementationEditor(
    {
      value,
      onChange,
      language = 'markdown',
      minHeight = 300,
      placeholder = 'Write here...',
      padding = 24,
      ...rest
    },
    ref,
  ) {
    return (
      <div className="w-tc-editor-var w-full code-impl-wrap">
        <CodeEditor
          ref={ref}
          value={value}
          language={language}
          placeholder={placeholder}
          data-color-mode="dark"
          className="code-impl match-braces rainbow-braces"
          padding={padding}
          minHeight={minHeight}
          onChange={(e) => onChange(e.target.value)}
          style={{
            backgroundColor: '#0F1115',
            color: '#F3F6FC',
            fontSize: 16,
            fontFamily:
              'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
            width: '100%',
          }}
          {...rest}
        />
      </div>
    );
  },
);
