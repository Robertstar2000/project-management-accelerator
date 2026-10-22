import React from 'react';

export const parseMarkdown = (markdownText: string): React.ReactNode[] => {
    if (!markdownText) return [];
    const lines = markdownText.split('\n');
    const elements: React.ReactNode[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let listItems: React.ReactNode[] = [];
    let tableRows: string[][] = [];
    let isTableActive = false;
    let codeBlockLines: string[] = [];
    let isCodeBlockActive = false;
    let codeLanguage = '';

    const flushList = () => {
        if (listItems.length > 0) {
            if (listType === 'ul') {
                elements.push(React.createElement('ul', { key: `list-${elements.length}`, className: 'list-disc ml-6 space-y-1 my-2 text-slate-300' }, listItems));
            } else if (listType === 'ol') {
                elements.push(React.createElement('ol', { key: `list-${elements.length}`, className: 'list-decimal ml-6 space-y-1 my-2 text-slate-300' }, listItems));
            }
            listItems = [];
            listType = null;
        }
    };

    const flushTable = () => {
        if (tableRows.length > 0) {
            const headerRow = tableRows[0];
            const bodyRows = tableRows.slice(1);
            
            const tableElem = React.createElement(
                'div',
                { key: `table-wrap-${elements.length}`, className: 'overflow-x-auto my-4 rounded-xl border border-slate-700/80 shadow-md' },
                React.createElement(
                    'table',
                    { className: 'w-full text-left text-xs border-collapse bg-slate-900/90 text-slate-200' },
                    [
                        React.createElement(
                            'thead',
                            { key: 'thead', className: 'bg-slate-800/90 border-b border-slate-700 text-cyan-300 font-semibold uppercase tracking-wider' },
                            React.createElement(
                                'tr',
                                null,
                                headerRow.map((cell, idx) =>
                                    React.createElement('th', { key: `th-${idx}`, className: 'px-4 py-3 border-r last:border-r-0 border-slate-700/60' }, cell.trim())
                                )
                            )
                        ),
                        React.createElement(
                            'tbody',
                            { key: 'tbody', className: 'divide-y divide-slate-800' },
                            bodyRows.map((row, rIdx) =>
                                React.createElement(
                                    'tr',
                                    { key: `tr-${rIdx}`, className: rIdx % 2 === 0 ? 'bg-slate-900/60 hover:bg-slate-800/50' : 'bg-slate-950/60 hover:bg-slate-800/50' },
                                    row.map((cell, cIdx) =>
                                        React.createElement('td', { key: `td-${cIdx}`, className: 'px-4 py-2.5 border-r last:border-r-0 border-slate-800 text-slate-300 font-mono text-[11px]' }, cell.trim())
                                    )
                                )
                            )
                        )
                    ]
                )
            );
            elements.push(tableElem);
            tableRows = [];
            isTableActive = false;
        }
    };

    const flushCodeBlock = () => {
        if (codeBlockLines.length > 0) {
            const fullCode = codeBlockLines.join('\n');
            elements.push(
                React.createElement(
                    'div',
                    { key: `code-block-${elements.length}`, className: 'my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg' },
                    [
                        codeLanguage && React.createElement(
                            'div',
                            { key: 'lang', className: 'px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between' },
                            [
                                React.createElement('span', { key: 'lang-text' }, codeLanguage),
                                React.createElement('span', { key: 'status-text', className: 'text-slate-500' }, 'Formatted Artifact')
                            ]
                        ),
                        React.createElement(
                            'pre',
                            { key: 'pre', className: 'p-4 overflow-x-auto text-xs font-mono text-emerald-300 leading-relaxed' },
                            React.createElement('code', null, fullCode)
                        )
                    ]
                )
            );
            codeBlockLines = [];
            isCodeBlockActive = false;
            codeLanguage = '';
        }
    };

    const parseLineToHtml = (line: string) => {
        let clean = line
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        
        clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
        clean = clean.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px]">$1</code>');
        clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline font-medium">$1</a>');
        return { __html: clean };
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        const key = `md-${index}`;

        // Handle Code Fences (```json, ```python, ```, etc.)
        if (trimmed.startsWith('```')) {
            if (isCodeBlockActive) {
                flushCodeBlock();
            } else {
                flushList();
                flushTable();
                isCodeBlockActive = true;
                codeLanguage = trimmed.replace(/^```/, '').trim();
            }
            return;
        }

        if (isCodeBlockActive) {
            codeBlockLines.push(line);
            return;
        }

        // Handle Markdown Tables (| Header 1 | Header 2 |)
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            flushList();
            // Skip markdown delimiter line (e.g., |---|---|)
            if (/^\|[-:\s|]+\|$/.test(trimmed)) {
                return;
            }
            const cells = trimmed
                .slice(1, -1)
                .split('|')
                .map(c => c.trim());
            tableRows.push(cells);
            isTableActive = true;
            return;
        } else if (isTableActive) {
            flushTable();
        }

        if (trimmed.startsWith('### ')) {
            flushList();
            elements.push(React.createElement('h3', { key, className: 'text-base font-bold text-cyan-300 mt-4 mb-2 tracking-tight', dangerouslySetInnerHTML: parseLineToHtml(trimmed.substring(4)) }));
        } else if (trimmed.startsWith('## ')) {
            flushList();
            elements.push(React.createElement('h2', { key, className: 'text-lg font-bold text-white mt-5 mb-2.5 tracking-tight border-b border-slate-800 pb-1', dangerouslySetInnerHTML: parseLineToHtml(trimmed.substring(3)) }));
        } else if (trimmed.startsWith('# ')) {
            flushList();
            elements.push(React.createElement('h1', { key, className: 'text-xl font-black text-white mt-6 mb-3 tracking-tight', dangerouslySetInnerHTML: parseLineToHtml(trimmed.substring(2)) }));
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (listType !== 'ul') {
                flushList();
                listType = 'ul';
            }
            listItems.push(React.createElement('li', { key, dangerouslySetInnerHTML: parseLineToHtml(trimmed.substring(2)) }));
        } else if (trimmed.match(/^\d+\.\s/)) {
            if (listType !== 'ol') {
                flushList();
                listType = 'ol';
            }
            listItems.push(React.createElement('li', { key, dangerouslySetInnerHTML: parseLineToHtml(trimmed.replace(/^\d+\.\s/, '')) }));
        } else if (trimmed === '---') {
            flushList();
            elements.push(React.createElement('hr', { key, className: 'my-6 border-slate-800' }));
        } else if (trimmed !== '') {
            flushList();
            elements.push(React.createElement('p', { key, className: 'my-2 leading-relaxed text-slate-300 text-xs sm:text-sm', dangerouslySetInnerHTML: parseLineToHtml(trimmed) }));
        }
    });

    if (isCodeBlockActive) flushCodeBlock();
    if (isTableActive) flushTable();
    flushList();
    return elements;
};