# Syntax-Sensei — Phase 1 Acceptance Tests

**Rules:** Mark `[x]` only when actually tested and passed on your PC. `[ ]` means **not passed / not confirmed / unsatisfactory / not yet tested**. Tell ChatGPT which interpretation applies, and attach screenshots, logs, or a short explanation. Do not proceed to Phase 2 before all required checks are passed, the Git push is verified, and you approve.

## A — Prerequisites

- [ ] P1. Python 3.12 and Node/npm are available.
- [ ] P2. Git works and VS Code opens.
- [ ] P3. Phase 1 ZIP extracted to a project folder.

## B — Install / build

- [ ] I1. Python virtual environment `.venv` created.
- [ ] I2. Python packages installed without errors.
- [ ] I3. npm dependencies installed without errors.
- [ ] I4. `npm run build` completes without errors.

## C — Automated tests

- [ ] T1. Python API unit/integration tests all pass.
- [ ] T2. `npm test` / Vitest tests pass.
- [ ] T3. Webview TypeScript checks pass.

## D — Functional UI tests

- [ ] U1. F5 opens the Extension Development Host.
- [ ] U2. Syntax-Sensei icon opens the sidebar dashboard.
- [ ] U3. `Syntax-Sensei: Open Learning Dashboard` command opens the full dashboard.
- [ ] U4. Backend status is Connected and no errors appear in Output → Syntax-Sensei.
- [ ] U5. Learn Python page displays three preview lessons, syntax examples and explanations.
- [ ] U6. Mark lesson complete increments progress count and shows a check mark.
- [ ] U7. Mark completed lesson again undoes completion and decrements count.
- [ ] U8. Completed lessons persist after closing and reopening the Extension Development Host.
- [ ] U9. Dashboard pages are readable and the interface is satisfactory.
- [ ] U10. Planned features are clearly marked as planned, not falsely presented as working.

## E — Initial GitHub push

- [ ] G1. `git init` and initial commit succeed.
- [ ] G2. `origin` points to `https://github.com/Nobelesse/Syntax-Sensei.git`.
- [ ] G3. `git push -u origin main` succeeds.
- [ ] G4. Source files and commit are visible on GitHub.
- [ ] G5. `.venv`, `node_modules` and databases were NOT pushed.

## F — Final acceptance

- [ ] A1. All required checklists are passed.
- [ ] A2. I am satisfied with the implemented Phase 1 features.
- [ ] A3. I approve Phase 1 and authorize Phase 2.

## Error report template

```text
SYNTAX-SENSEI — PHASE 1 ERROR REPORT
Unpassed/unchecked test IDs:
Problem category: [Error / Doesn't work / Not satisfied / Not yet tested]
Expected behavior:
Actual behavior:
Exact error text (if available):
Steps to reproduce:
Screenshots/logs attached: [Yes / No]
```

**Remember:** The ChatGPT delivery also includes interactive **Copy Results** buttons for each checklist plus a **Copy Complete Phase Report** button. Paste the copied text into ChatGPT and attach screenshots before pressing Send.
