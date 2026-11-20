# Syntax-Sensei Phase 2 — Troubleshooting

1. **Ollama disconnected**: `ollama list`; make sure the Ollama desktop service is running. If not, use `ollama serve` in a separate terminal, unless the desktop app has already started it. Then refresh models. No internet is needed after installing Ollama and model weights.
2. **Model selector empty**: run `ollama list`. Syntax-Sensei does not automatically download models. If your `llama3.2:3b` is missing, you may optionally run `ollama pull llama3.2:3b` (requires download/internet). There is no need if already installed.
3. **AI takes a long time**: initial model loading may be slow with 8 GB RAM and RTX 2050 4 GB VRAM. Try `llama3.2:1b`, which was installed on the user's PC. Phase 2 uses non-streaming responses and has a 180-second Ollama request timeout.
4. **AI request error**: AI panel shows the error. Also open VS Code > View > Output > Syntax-Sensei. If the Python backend still shows connected, the failure may be limited to Ollama.
5. **Selected code not imported**: select text in a source editor, then from the Command Palette execute `Syntax-Sensei: Explain Selected Code`. Code must be under 12,000 characters. The code is prefilled in the AI panel but never auto-sent.
6. **Your previous lesson progress disappears**: STOP and do not overwrite database files. The Phase 2 installer does not touch SQLite, `.venv` or globalStorage. Check that you launched the same VS Code profile and extension development path.
7. **Node installation errors**: Phase 2 introduces no new npm dependencies. It intentionally keeps the audited Phase 1 versions. Do not run `npm audit fix --force`. If `node_modules` is missing, run `npm ci` from the original project folder with internet.
8. **Installation script refuses to run**: the upgrade requires Phase 1 v0.1.4, Vitest 4.1.12, VSCE 4.1.1 and the minimatch 11.0.8 override. Stop and report the existing `package.json` version; don't bypass safety checks.
9. **Backend process or dashboard broken**: run `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1` and send output. Backups of overwritten files are kept under `E:\Projects\Syntax-Sensei-backups\phase-02-*`.

**Privacy**: Ollama calls are sent only to `127.0.0.1:11434`; no cloud API keys. Local Ollama logs may exist independently. AI chat is held in webview memory and clears on reload; it is not saved in the progress SQLite database. Do not paste secrets, and verify all AI-proposed code changes manually. Phase 2 never executes AI-suggested code.
