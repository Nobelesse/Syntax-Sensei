import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MarkdownAnswer from './MarkdownAnswer';

const render = (content: string) => renderToStaticMarkup(createElement(MarkdownAnswer, { content }));

describe('AI Markdown answer presentation', () => {
  it('renders headings, bold text and bullets instead of literal markdown markers', () => {
    const html = render('# Python operators\n\n**Arithmetic** operators:\n\n- Addition\n- Subtraction');
    expect(html).toContain('<h1>Python operators</h1>');
    expect(html).toContain('<strong>Arithmetic</strong>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Addition</li>');
    expect(html).not.toContain('**Arithmetic**');
  });

  it('renders fenced code in its own code panel with a copy button', () => {
    const html = render('```python\nprint(5)\n```');
    expect(html).toContain('sensei-code-panel');
    expect(html).toContain('Copy code');
    expect(html).toContain('print(5)');
  });

  it('supports GitHub-flavored tables and simple inline code', () => {
    const html = render('| Operator | Meaning |\n|---|---|\n| `+` | Addition |');
    expect(html).toContain('<table>');
    expect(html).toContain('<code>+</code>');
    expect(html).toContain('Addition');
  });

  it('does not mount raw script tags or fetch model-supplied images', () => {
    const html = render('<script>alert(1)</script>\n\n![tracker](https://example.com/pixel.png)');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('src="https://example.com/pixel.png"');
  });

  it('does not turn javascript: URLs into clickable links', () => {
    const html = render('[bad](javascript:alert(1))');
    expect(html).not.toContain('href="javascript:');
  });
});
