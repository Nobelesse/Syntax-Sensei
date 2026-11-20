# Phase 2: AI Answer Formatting Fix (v0.2.1)

## Purpose

Displays Ollama responses as properly formatted Markdown inside the VS Code extension, rather than unstyled `#` and `*` markers. Covers headings, numbered/bulleted lists, bold/emphasis, safe external links, tables, blockquotes, inline code, and fenced code with a copy control. A separate copy control copies the entire response as plain Markdown.

## Implementation

- `webview/src/MarkdownAnswer.tsx`: React Markdown renderer, uses `react-markdown` and `remark-gfm`.
- `webview/src/answer-styles.css`: Professional dark-theme styling, responsive text/code/table overflow.
- `webview/src/MarkdownAnswer.test.ts`: Static HTML rendering and security regression tests.
- `webview/src/main.tsx`: AI answers use `MarkdownAnswer` and user turns remain plain text.
- `scripts/apply-answer-formatting.cjs`: Explicit checks and small, idempotent source change.

`react-markdown` is used without `rehype-raw` or `dangerouslySetInnerHTML`. `skipHtml` discards model-supplied raw HTML, and external images are not rendered. Links are limited to HTTP(S). This is intended to avoid executing model-supplied markup as code.

## Install

From the extracted fix-package folder, run `install-formatting-fix.ps1`. It targets only `E:\Projects\Syntax-Sensei` and backs up modified files under `E:\Projects\Syntax-Sensei-backups`. It installs two additional npm packages (Internet required for first install) and updates the project to v0.2.1. Keep the backup until all tests pass.

## Test

```powershell
Set-Location 'E:\Projects\Syntax-Sensei'
npm ls react-markdown remark-gfm
powershell -ExecutionPolicy Bypass -File .\scripts\test-phase2.ps1
npm audit
npm run build
npx --no-install vsce ls
code .
```

Press F5, open AI Sensei in the Extension Development Host and ask for **Types of operators in Python**, plus one answer requesting a table and fenced Python code. Headings and bullets should render without raw Markdown syntax. The complete Markdown text remains copyable. Check that existing Ollama chat, selected-code explanation, Python lessons, and saved progress still work.

**Note:** Opening `dist/webview/index.html` directly in Chrome from a `file://` path is not supported. The dashboard needs the VS Code webview messaging API. Always test using F5 in VS Code.

If the npm install or tests fail, do not push; share the copied checklist and error output. Do not use `npm audit fix --force`.

## Git

After all tests pass, stage the Phase 2 and UI files together for the phase's first push. This patch does not perform any Git operation or modify `.git`.
