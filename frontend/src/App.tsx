import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import RehypeKatex from 'rehype-katex';
import RehypeHighlight from 'rehype-highlight';
import mermaid from 'mermaid';
import {OpenFile, SaveFile} from "../wailsjs/go/main/App";
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/atom-one-dark.css';
import './App.css';

// 导入 Markdown 初始内容
import initialMarkdown from './initial.md?raw';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
});

function App() {
    const [markdown, setMarkdown] = useState(initialMarkdown);


    useEffect(() => {
        // 确保 DOM 更新后再运行 mermaid
        const timer = setTimeout(() => {
            try {
                // Mermaid v8 API 使用 init
                mermaid.init(undefined, document.querySelectorAll('.mermaid'));
            } catch (e) {
                console.error("Mermaid render error:", e);
            }
        }, 200); // 增加延迟到200ms，确保DOM渲染完成，特别是首次加载
        return () => clearTimeout(timer);
    }, [markdown]);

    const CodeBlock = ({ language, children }: any) => {
        const [copied, setCopied] = useState(false);
        
        const codeRef = React.useRef<HTMLDivElement>(null);
        
        const copyCode = () => {
            if (codeRef.current) {
                const codeElement = codeRef.current.querySelector('code');
                const text = codeElement ? codeElement.innerText : '';
                navigator.clipboard.writeText(text).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                });
            }
        };

        return (
            <div className="code-block-wrapper" ref={codeRef}>
                <div className="code-block-header">
                    <span className="code-lang">{language || 'text'}</span>
                    <button className="copy-button" onClick={copyCode}>
                        {copied ? (
                            <>
                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                                Copy code
                            </>
                        )}
                    </button>
                </div>
                <pre style={{margin: 0}}>
                    {children}
                </pre>
            </div>
        );
    };

    const components = {
        code({node, inline, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';

            if (!inline && lang === 'mermaid') {
                return (
                    <div className="mermaid">
                        {String(children).replace(/\n$/, '')}
                    </div>
                );
            }
            
            if (!inline && match) {
                return (
                    <CodeBlock language={lang}>
                        <code className={className} {...props}>
                            {children}
                        </code>
                    </CodeBlock>
                );
            }

            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        }
    };

    const handleOpenFile = () => {
        OpenFile().then((content) => {
            if (content) {
                setMarkdown(content);
            }
        }).catch((err) => {
            console.error("Failed to open file:", err);
            // 可以在这里显示一个错误提示给用户
        });
    };

    const handleSaveFile = () => {
        SaveFile(markdown).then((path) => {
            if (path) {
                console.log("File saved to:", path);
            }
        }).catch((err) => {
            console.error("Failed to save file:", err);
            // 可以在这里显示一个错误提示给用户
        });
    };





    return (
        <div id="App">
            <div className="toolbar">
                <button onClick={handleOpenFile}>Open</button>
                <button onClick={handleSaveFile}>Save</button>
            </div>
            <div className="main-content">
                <div className="editor-pane" style={{ width: '50%' }}>
                    <textarea
                        className="markdown-input"
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        spellCheck="false"
                    />
                </div>
                <div className="preview-pane" style={{ width: '50%' }}>
                    <ReactMarkdown
                        components={components}
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[
                            [RehypeKatex, { onError: (e: any) => console.error('KaTeX rendering error:', e) }],
                            [RehypeHighlight, { ignoreMissing: true }]
                        ]}
                    >
                        {markdown}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}

export default App;