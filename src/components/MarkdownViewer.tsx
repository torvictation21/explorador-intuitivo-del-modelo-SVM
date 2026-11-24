import React from 'react';

interface MarkdownViewerProps {
  content: string;
  searchQuery?: string;
}

function renderInline(text: string): React.ReactNode[] {
  // Cleanly format bold, italic, inline code, and clean inline math $...$
  const tokens: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\$[^$]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const raw = match[0];
    if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-[#eaedff] text-[#003ea8] font-mono text-[12px]"
        >
          {raw.slice(1, -1)}
        </code>
      );
    } else if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push(
        <strong key={key++} className="font-semibold text-[#131b2e]">
          {renderInline(raw.slice(2, -2))}
        </strong>
      );
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push(
        <em key={key++} className="italic text-[#334155]">
          {raw.slice(1, -1)}
        </em>
      );
    } else if (raw.startsWith('$') && raw.endsWith('$')) {
      const cleanedMath = raw
        .slice(1, -1)
        .replace(/\\text\{([^}]+)\}/g, '$1')
        .replace(/\\mathbf\{([^}]+)\}/g, '$1')
        .replace(/\\mathbb\{R\}/g, 'ℝ')
        .replace(/\\le/g, '≤')
        .replace(/\\ge/g, '≥')
        .replace(/\\rightarrow/g, '→')
        .replace(/\\leftrightarrow/g, '↔')
        .replace(/\\times/g, '×')
        .replace(/\\cdot/g, '·')
        .replace(/\\Delta/g, 'Δ')
        .replace(/\\theta/g, 'θ')
        .replace(/\\tau/g, 'τ')
        .replace(/\\alpha/g, 'α')
        .replace(/\\langle/g, '⟨')
        .replace(/\\rangle/g, '⟩')
        .replace(/\\subseteq/g, '⊆')
        .replace(/\\in/g, '∈')
        .replace(/\\|/g, '‖')
        .replace(/\\frac\{1\}\{2\}/g, '½')
        .replace(/\\_/g, '_')
        .replace(/\\%/g, '%')
        .replace(/\\,/g, ' ')
        .replace(/\\ /g, ' ');
      tokens.push(
        <span
          key={key++}
          className="font-mono text-[12.5px] text-[#004ac6] bg-[#f2f3ff] px-1 rounded"
        >
          {cleanedMath}
        </span>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, searchQuery }) => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  const query = (searchQuery || '').trim().toLowerCase();

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code blocks (supports nested markdown code fences in DAPI-06)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      let fenceDepth = 1;
      while (i < lines.length && fenceDepth > 0) {
        const curTrim = lines[i].trim();
        if (curTrim.startsWith('```') && curTrim.length > 3 && lang === 'markdown') {
          fenceDepth++;
          codeLines.push(lines[i]);
        } else if (curTrim === '```') {
          fenceDepth--;
          if (fenceDepth > 0) codeLines.push(lines[i]);
        } else {
          codeLines.push(lines[i]);
        }
        i++;
      }

      const codeText = codeLines.join('\n');
      if (!query || codeText.toLowerCase().includes(query)) {
        elements.push(
          <div
            key={blockKey++}
            className="my-4 rounded-xl overflow-hidden border border-[#c3c6d7]/60 bg-[#131b2e]"
          >
            {lang && (
              <div className="px-3.5 py-1.5 bg-[#1e293b] text-[#b4c5ff] font-mono text-[11px] uppercase tracking-wider flex items-center justify-between">
                <span>{lang}</span>
                <span className="text-[#94a3b8] normal-case">{codeLines.length} líneas</span>
              </div>
            )}
            <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed font-mono text-[#eef0ff] max-h-[420px]">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      elements.push(<hr key={blockKey++} className="my-5 border-[#dae2fd]" />);
      i++;
      continue;
    }

    // Headings H1 - H4
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const matchClass =
        query && text.toLowerCase().includes(query)
          ? 'bg-[#fef08a]/60 px-1 rounded'
          : '';

      if (level === 1) {
        elements.push(
          <h1
            key={blockKey++}
            className={`font-display text-2xl font-bold text-[#131b2e] mt-2 mb-3 tracking-tight ${matchClass}`}
          >
            {renderInline(text)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2
            key={blockKey++}
            className={`font-display text-lg font-semibold text-[#004ac6] mt-6 mb-2.5 pb-1.5 border-b border-[#e2e7ff] ${matchClass}`}
          >
            {renderInline(text)}
          </h2>
        );
      } else if (level === 3) {
        elements.push(
          <h3
            key={blockKey++}
            className={`font-display text-[15px] font-semibold text-[#131b2e] mt-4 mb-2 ${matchClass}`}
          >
            {renderInline(text)}
          </h3>
        );
      } else {
        elements.push(
          <h4
            key={blockKey++}
            className={`font-display text-sm font-semibold text-[#434655] mt-3 mb-1.5 ${matchClass}`}
          >
            {renderInline(text)}
          </h4>
        );
      }
      i++;
      continue;
    }

    // GFM Tables
    if (
      trimmed.startsWith('|') &&
      i + 1 < lines.length &&
      /^\|[\s:|-]+\|/.test(lines[i + 1].trim())
    ) {
      const parseRow = (rowStr: string) =>
        rowStr
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim());

      const headers = parseRow(trimmed);
      i += 2; // Skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseRow(lines[i]));
        i++;
      }

      const filteredRows = query
        ? rows.filter((r) => r.some((c) => c.toLowerCase().includes(query)))
        : rows;

      if (!query || filteredRows.length > 0 || headers.some((h) => h.toLowerCase().includes(query))) {
        const displayRows = filteredRows.length > 0 ? filteredRows : rows;
        elements.push(
          <div
            key={blockKey++}
            className="my-4 overflow-x-auto rounded-xl border border-[#dae2fd] bg-white"
          >
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f2f3ff] border-b border-[#dae2fd]">
                  {headers.map((h, idx) => (
                    <th
                      key={idx}
                      className="px-3.5 py-2.5 font-display font-semibold text-[#131b2e] align-top"
                    >
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaedff]">
                {displayRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={rIdx % 2 === 0 ? 'bg-white' : 'bg-[#faf8ff]'}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3.5 py-2.5 text-[#334155] leading-relaxed align-top"
                      >
                        {cell.split('<br>').map((seg, sIdx) => (
                          <React.Fragment key={sIdx}>
                            {sIdx > 0 && <br />}
                            {renderInline(seg)}
                          </React.Fragment>
                        ))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Blockquotes
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const quoteText = quoteLines.join(' ');
      if (!query || quoteText.toLowerCase().includes(query)) {
        elements.push(
          <blockquote
            key={blockKey++}
            className="my-3 px-4 py-3 rounded-xl bg-[#f2f3ff] border border-[#dae2fd] text-[13.5px] text-[#131b2e] leading-relaxed"
          >
            {renderInline(quoteText)}
          </blockquote>
        );
      }
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      const visibleItems = query
        ? items.filter((item) => item.toLowerCase().includes(query))
        : items;
      if (visibleItems.length > 0) {
        elements.push(
          <ul key={blockKey++} className="my-2.5 space-y-1.5 pl-5 list-disc text-[13.5px] text-[#334155]">
            {visibleItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
      }
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      const visibleItems = query
        ? items.filter((item) => item.toLowerCase().includes(query))
        : items;
      if (visibleItems.length > 0) {
        elements.push(
          <ol key={blockKey++} className="my-2.5 space-y-1.5 pl-5 list-decimal text-[13.5px] text-[#334155]">
            {visibleItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      }
      continue;
    }

    // Regular paragraph
    const paraLines: string[] = [trimmed];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('>') &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    const paraText = paraLines.join(' ');
    if (!query || paraText.toLowerCase().includes(query)) {
      elements.push(
        <p key={blockKey++} className="my-2.5 text-[13.5px] text-[#334155] leading-relaxed">
          {renderInline(paraText)}
        </p>
      );
    }
  }

  if (query && elements.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[#434655]">
        No se encontraron coincidencias para «{searchQuery}» en este documento.
      </div>
    );
  }

  return <div className="max-w-none">{elements}</div>;
};
