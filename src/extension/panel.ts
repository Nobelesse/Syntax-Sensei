import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { BackendManager } from './backend';

interface WebviewRequest {
  type?: string;
  lessonId?: string;
  completed?: boolean;
}

export class SenseiPanel implements vscode.WebviewViewProvider {
  static readonly viewId = 'syntaxSensei.sidebar';
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly backend: BackendManager
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.configure(view.webview);
  }

  openDashboard(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'syntaxSensei.dashboard', 'Syntax-Sensei • Learning Dashboard', vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview')] }
    );
    this.panel = panel;
    this.configure(panel.webview);
    panel.onDidDispose(() => { this.panel = undefined; });
  }

  private configure(webview: vscode.Webview): void {
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview')]
    };
    webview.html = this.html(webview);
    webview.onDidReceiveMessage((message: unknown) => {
      void this.handleMessage(webview, message);
    });
  }

  private async handleMessage(webview: vscode.Webview, incoming: unknown): Promise<void> {
    if (!incoming || typeof incoming !== 'object') {
      return;
    }
    const message = incoming as WebviewRequest;
    try {
      if (message.type === 'bootstrap') {
        const data = await this.backend.getBootstrap();
        await webview.postMessage({ type: 'bootstrap', data });
      } else if (message.type === 'updateProgress') {
        if (typeof message.lessonId !== 'string' || typeof message.completed !== 'boolean') {
          throw new Error('Malformed progress request.');
        }
        const data = await this.backend.updateProgress(message.lessonId, message.completed);
        await webview.postMessage({ type: 'progress', data });
      } else if (message.type === 'openDashboard') {
        this.openDashboard();
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      await webview.postMessage({ type: 'error', message: reason });
    }
  }

  private html(webview: vscode.Webview): string {
    const target = path.join(this.context.extensionPath, 'dist', 'webview', 'index.html');
    if (!fs.existsSync(target)) {
      return `<!DOCTYPE html><html><body><h3>Syntax-Sensei UI not built</h3><p>Run <code>npm run build</code> in the project folder, then reload this extension.</p></body></html>`;
    }
    const folder = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'assets');
    let html = fs.readFileSync(target, 'utf8');
    html = html.replace(/(src|href)="\.\/assets\/([^\"]+)"/g, (_match, attr: string, file: string) => {
      const uri = webview.asWebviewUri(vscode.Uri.joinPath(folder, file));
      return `${attr}="${uri}"`;
    });
    const policy = [
      "default-src 'none'",
      `img-src ${webview.cspSource} data:`,
      `font-src ${webview.cspSource}`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src ${webview.cspSource}`
    ].join('; ');
    html = html.replace('</head>', `<meta http-equiv="Content-Security-Policy" content="${policy};"></head>`);
    return html;
  }
}
