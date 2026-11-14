'use strict';

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const packagePath = path.join(projectRoot, 'package.json');
const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

if (manifest.name !== 'syntax-sensei') {
  throw new Error('This script is only for the Syntax-Sensei project.');
}
if (manifest.devDependencies?.['@vscode/vsce'] !== '4.1.1') {
  throw new Error('Expected @vscode/vsce 4.1.1 from Phase 1 Security Fix 03.');
}
if (manifest.devDependencies?.vitest !== '4.1.12') {
  throw new Error('Expected Vitest 4.1.12 from Phase 1 Security Fix 03.');
}
if (!['0.1.3', '0.1.4'].includes(manifest.version)) {
  throw new Error(`Unexpected project version ${manifest.version}. Stop and review before patching.`);
}

if (manifest.overrides && (typeof manifest.overrides !== 'object' || Array.isArray(manifest.overrides))) {
  throw new Error('Unexpected overrides format in package.json.');
}
manifest.overrides ??= {};
const existing = manifest.overrides['@vscode/vsce'];
if (existing && (typeof existing !== 'object' || Array.isArray(existing))) {
  throw new Error('Existing @vscode/vsce override needs manual review.');
}
manifest.overrides['@vscode/vsce'] = {
  ...(existing ?? {}),
  minimatch: '11.0.8',
};
manifest.version = '0.1.4';

fs.writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log('Updated package.json to v0.1.4 with a VSCE-scoped minimatch 11.0.8 override.');
