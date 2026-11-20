'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
const checkOnly = process.argv.includes('--check-only');
if (!root) throw new Error('Syntax-Sensei project location is required.');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (manifest.name !== 'syntax-sensei' || !['0.2.0','0.2.1'].includes(manifest.version)) {
  throw new Error(`Expected Syntax-Sensei Phase 2 (v0.2.0 or v0.2.1), found ${manifest.name} ${manifest.version}. No changes made.`);
}
const file = path.join(root, 'webview', 'src', 'main.tsx');
const original = fs.readFileSync(file, 'utf8');
const newline = original.includes('\r\n') ? '\r\n' : '\n';
const normal = original.replace(/\r\n/g, '\n');
const imports = [
  ["import './style.css';", "import './style.css';\nimport './answer-styles.css';"],
  ["import { createRoot } from 'react-dom/client';", "import { createRoot } from 'react-dom/client';\nimport MarkdownAnswer from './MarkdownAnswer';"],
];
const currentTurn = '<pre>{turn.content}</pre>';
const newTurn = "{turn.role === 'assistant' ? <MarkdownAnswer content={turn.content} /> : <div className=\"ai-user-text\">{turn.content}</div>}";
let updated = normal;
for (const [before, after] of imports) {
  if (!updated.includes(after)) {
    if (!updated.includes(before)) throw new Error(`Unexpected frontend import structure: ${before}. No changes made.`);
    updated = updated.replace(before, after);
  }
}
if (!updated.includes(newTurn)) {
  if (!updated.includes(currentTurn)) throw new Error('Unexpected AI conversation markup in main.tsx. No changes made.');
  updated = updated.replace(currentTurn, newTurn);
}
if (!updated.includes("const request = pendingAi.current;\n        if (!request || request.id !== message.requestId) return;")) {
  throw new Error('Phase 2 TS18047 Fix 01 is missing. Apply that fix before the UI update. No changes made.');
}
if (checkOnly) {
  process.stdout.write('Phase 2 source matches the expected formatting-fix target.\n');
  process.exit(0);
}
if (updated === normal) {
  console.log('AI Markdown renderer is already wired into the dashboard.');
} else {
  fs.writeFileSync(file, updated.replace(/\n/g, newline), 'utf8');
  console.log('Updated webview/src/main.tsx with the formatted AI answer component.');
}
