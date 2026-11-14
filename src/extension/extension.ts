import * as vscode from 'vscode';
import { BackendManager } from './backend';
import { SenseiPanel } from './panel';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Syntax-Sensei');
  const backend = new BackendManager(context, output);
  const panel = new SenseiPanel(context, backend);

  context.subscriptions.push(
    output,
    backend,
    vscode.window.registerWebviewViewProvider(SenseiPanel.viewId, panel, {
      webviewOptions: { retainContextWhenHidden: true }
    }),
    vscode.commands.registerCommand('syntaxSensei.openDashboard', () => panel.openDashboard()),
    vscode.commands.registerCommand('syntaxSensei.checkConnection', async () => {
      try {
        const health = await backend.checkHealth() as { version?: string };
        void vscode.window.showInformationMessage(`Syntax-Sensei backend is online (v${health.version ?? 'unknown'}).`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        output.show(true);
        void vscode.window.showErrorMessage(`Syntax-Sensei backend unavailable: ${message}`);
      }
    })
  );
  output.appendLine('Syntax-Sensei Phase 1 extension activated.');
}

export function deactivate(): void {
  // BackendManager is disposed through the VS Code extension subscriptions.
}
