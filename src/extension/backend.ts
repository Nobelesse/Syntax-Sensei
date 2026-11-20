import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as http from 'node:http';
import * as net from 'node:net';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

function freeLocalPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not reserve a local TCP port.'));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

export class BackendManager implements vscode.Disposable {
  private process: ChildProcessWithoutNullStreams | undefined;
  private startPromise: Promise<void> | undefined;
  private port: number | undefined;
  private stopped = false;
  private lastError = '';

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly output: vscode.OutputChannel
  ) {}

  private choosePython(): string {
    const configured = vscode.workspace.getConfiguration('syntaxSensei').get<string>('pythonPath')?.trim();
    if (configured) {
      return configured;
    }
    const paths = process.platform === 'win32'
      ? [path.join(this.context.extensionPath, '.venv', 'Scripts', 'python.exe')]
      : [path.join(this.context.extensionPath, '.venv', 'bin', 'python')];
    for (const candidate of paths) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return process.platform === 'win32' ? 'python' : 'python3';
  }

  async ensureRunning(): Promise<void> {
    if (this.stopped) {
      throw new Error('The extension is shutting down.');
    }
    if (!this.startPromise) {
      this.startPromise = this.start().catch((error: unknown) => {
        this.startPromise = undefined;
        throw error;
      });
    }
    return this.startPromise;
  }

  private async start(): Promise<void> {
    await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);
    const dbFile = path.join(this.context.globalStorageUri.fsPath, 'progress.sqlite3');
    const port = await freeLocalPort();
    const python = this.choosePython();
    this.lastError = '';
    this.port = port;
    this.output.appendLine(`[Syntax-Sensei] Starting local backend on 127.0.0.1:${port}`);
    this.output.appendLine(`[Syntax-Sensei] Python executable: ${python}`);
    const child = spawn(
      python,
      ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', String(port), '--no-access-log'],
      {
        cwd: this.context.extensionPath,
        windowsHide: true,
        env: { ...process.env, SYNTAX_SENSEI_DB_PATH: dbFile },
        shell: false
      }
    );
    this.process = child;
    child.stdout.on('data', data => this.output.append(String(data).trimEnd() + '\n'));
    child.stderr.on('data', data => this.output.append(String(data).trimEnd() + '\n'));
    child.on('error', err => {
      this.lastError = err.message;
      this.output.appendLine(`[Syntax-Sensei] Python process error: ${err.message}`);
    });
    child.on('exit', (code, signal) => {
      this.output.appendLine(`[Syntax-Sensei] Backend exited: code=${code}, signal=${signal}`);
      if (this.process === child) {
        this.process = undefined;
        this.port = undefined;
        this.startPromise = undefined;
      }
    });

    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (this.lastError) {
        throw new Error(`Backend could not start: ${this.lastError}. See Output > Syntax-Sensei.`);
      }
      if (child.exitCode !== null) {
        throw new Error(`Python backend exited with code ${child.exitCode}. See Output > Syntax-Sensei.`);
      }
      try {
        const health = await this.requestRaw('/health', 'GET');
        if ((health as { status?: string }).status === 'ok') {
          this.output.appendLine('[Syntax-Sensei] Local backend ready.');
          return;
        }
      } catch {
        // Startup is still in progress.
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    child.kill();
    throw new Error('Local backend did not become ready. Verify backend dependencies and see Output > Syntax-Sensei.');
  }

  private async requestRaw(route: string, method: 'GET' | 'POST', body?: object, timeoutMs = 4000): Promise<unknown> {
    if (!this.port) {
      throw new Error('Backend has not started.');
    }
    const payload = body ? JSON.stringify(body) : undefined;
    const port = this.port;
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1', port, path: route, method, timeout: timeoutMs,
        headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}
      }, response => {
        const chunks: Buffer[] = [];
        let length = 0;
        response.on('data', (chunk: Buffer) => {
          length += chunk.length;
          if (length > 1024 * 1024) {
            req.destroy(new Error('Backend response exceeded size limit.'));
            return;
          }
          chunks.push(chunk);
        });
        response.on('end', () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
            if ((response.statusCode ?? 500) >= 400) {
              reject(new Error(`Backend HTTP ${response.statusCode}: ${JSON.stringify(json)}`));
            } else {
              resolve(json);
            }
          } catch (error) {
            reject(error);
          }
        });
        response.on('error', reject);
      });
      req.on('error', reject);
      req.on('timeout', () => req.destroy(new Error('Local backend request timed out.')));
      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  async getBootstrap(): Promise<unknown> {
    await this.ensureRunning();
    return this.requestRaw('/api/bootstrap', 'GET');
  }

  async updateProgress(lessonId: string, completed: boolean): Promise<unknown> {
    await this.ensureRunning();
    if (!/^[a-z0-9-]{1,64}$/.test(lessonId)) {
      throw new Error('Invalid lesson ID.');
    }
    return this.requestRaw(`/api/lessons/${lessonId}/progress`, 'POST', { completed });
  }

  async ollamaStatus(): Promise<unknown> {
    await this.ensureRunning();
    return this.requestRaw('/api/ai/status', 'GET', undefined, 7000);
  }

  async aiChat(payload: object): Promise<unknown> {
    await this.ensureRunning();
    return this.requestRaw('/api/ai/chat', 'POST', payload, 190000);
  }

  async checkHealth(): Promise<unknown> {
    await this.ensureRunning();
    return this.requestRaw('/health', 'GET');
  }

  dispose(): void {
    this.stopped = true;
    this.process?.kill();
    this.process = undefined;
    this.startPromise = undefined;
    this.port = undefined;
  }
}
