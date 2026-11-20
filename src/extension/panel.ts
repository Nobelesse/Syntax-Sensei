import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { BackendManager } from './backend';

interface WebviewRequest {
  type?: string;
  lessonId?: string;
  completed?: boolean;
  requestId?: string;
  payload?: unknown;
  model?: string;
}

interface EditorSelection {
  code: string;
  language: string;
}

export class SenseiPanel implements vscode.WebviewViewProvider {
  static readonly viewId = 'syntaxSensei.sidebar';
  private panel: vscode.WebviewPanel | undefined;
  private selectedCode: EditorSelection | undefined;

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
      'syntaxSensei.dashboard', 'Syntax-Sensei • AI Coding Mentor', vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview')] }
    );
    this.panel = panel;
    this.configure(panel.webview);
    panel.onDidDispose(() => { this.panel = undefined; });
  }

  explainSelectedCode(): void {
    const editor = vscode.window.activeTextEditor;
    const text = editor?.document.getText(editor.selection) ?? '';
    if (!text.trim()) {
      void vscode.window.showInformationMessage('Select code in the editor first, then run Syntax-Sensei: Explain Selected Code.');
      return;
    }
    if (text.length > 12000) {
      void vscode.window.showWarningMessage('Selection is longer than 12,000 characters. Select a smaller code sample.');
      return;
    }
    this.selectedCode = { code: text, language: editor!.document.languageId };
    const alreadyOpen = Boolean(this.panel);
    this.openDashboard();
    if (alreadyOpen && this.panel) {
      // Existing panels are initialized; new panels receive the selection after bootstrap.
      void this.panel.webview.postMessage({ type: 'editorSelection', data: this.selectedCode });
      this.selectedCode = undefined;
    }
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
    if (!incoming || typeof incoming !== 'object') return;
    const message = incoming as WebviewRequest;
    const requestId = typeof message.requestId === 'string' && /^[a-zA-Z0-9_-]{1,40}$/.test(message.requestId)
      ? message.requestId : undefined;
    try {
      if (message.type === 'bootstrap') {
        const data = await this.backend.getBootstrap();
        await webview.postMessage({ type: 'bootstrap', data });
        if (this.panel?.webview === webview && this.selectedCode) {
          await webview.postMessage({ type: 'editorSelection', data: this.selectedCode });
          this.selectedCode = undefined;
        }
      } else if (message.type === 'updateProgress') {
        if (typeof message.lessonId !== 'string' || typeof message.completed !== 'boolean') {
          throw new Error('Malformed progress request.');
        }
        const data = await this.backend.updateProgress(message.lessonId, message.completed);
        await webview.postMessage({ type: 'progress', data });
      } else if (message.type === 'aiStatus') {
        const data = await this.backend.ollamaStatus();
        await webview.postMessage({ type: 'aiStatus', data });
      } else if (message.type === 'aiWarmup') {
        if (typeof message.model !== 'string' || message.model.length > 120) {
          throw new Error('Invalid model selection for warm-up.');
        }
        const data = await this.backend.warmupModel(message.model);
        await webview.postMessage({ type: 'aiWarmup', data });
      } else if (message.type === 'aiChatStream') {
        if (!message.payload || typeof message.payload !== 'object' || Array.isArray(message.payload)) {
          throw new Error('Malformed streaming AI request.');
        }
        let pendingText = '';
        let timer: ReturnType<typeof setTimeout> | undefined;
        const flush = () => {
          if (!pendingText) return;
          const text = pendingText;
          pendingText = '';
          void webview.postMessage({ type: 'aiChunk', text, requestId });
        };
        try {
          const data = await this.backend.aiChatStream(message.payload, text => {
            pendingText += text;
            if (!timer) {
              timer = setTimeout(() => { timer = undefined; flush(); }, 100);
            }
          });
          if (timer) clearTimeout(timer);
          flush();
          await webview.postMessage({ type: 'aiResponse', data, requestId });
        } catch (error) {
          if (timer) clearTimeout(timer);
          flush();
          throw error;
        }
      } else if (message.type === 'aiChat') {
        if (!message.payload || typeof message.payload !== 'object' || Array.isArray(message.payload)) {
          throw new Error('Malformed AI request.');
        }
        const data = await this.backend.aiChat(message.payload);
        await webview.postMessage({ type: 'aiResponse', data, requestId });
      } else if (message.type === 'openDashboard') {
        this.openDashboard();
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const type = ['aiChat', 'aiChatStream', 'aiStatus', 'aiWarmup'].includes(message.type ?? '') ? (message.type === 'aiWarmup' ? 'aiWarmupError' : 'aiError') : 'error';
      await webview.postMessage({ type, message: reason, requestId });
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
