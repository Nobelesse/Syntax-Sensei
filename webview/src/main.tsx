import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MarkdownAnswer from './MarkdownAnswer';
import { buildQuestionIndex } from './questionNavigator';
import { completionPercentage, isLessonComplete, type Bootstrap, type Progress, type Lesson } from './progress';
import './style.css';
import './answer-styles.css';

type Page = 'dashboard' | 'ai' | 'learn' | 'progress' | 'roadmap';
type AiMode = 'chat' | 'explain' | 'debug' | 'hint';
type AiDepth = 'quick' | 'balanced' | 'detailed';
type AiStatus = { online: boolean; models: string[]; preferred_model: string | null; message: string };
type AiTurn = { role: 'user' | 'assistant'; content: string; mode: AiMode; model?: string };
const aiModes: {value: AiMode; label: string; description: string}[] = [
  { value: 'chat', label: 'Ask Sensei', description: 'Programming questions and conceptual guidance' },
  { value: 'explain', label: 'Explain Code', description: 'Understand pasted or selected code line by line' },
  { value: 'debug', label: 'Find Possible Bugs', description: 'Identify likely problems and suggest corrections' },
  { value: 'hint', label: 'Progressive Hints', description: 'Get a nudge before the complete solution' },
];
type VsCodeApi = { postMessage(message: object): void };

declare global {
  interface Window { acquireVsCodeApi?: () => VsCodeApi }
}
const vsCode = window.acquireVsCodeApi?.();

const planned = [
  { icon: '{ }', title: 'Advanced Code Analysis', desc: 'Deeper project-wide diagnostics, refactoring and testing tools.', phase: 'Phase 3' },
  { icon: '⌘', title: 'Complete Language Courses', desc: 'Python, Java, C, C++, R and more — structured from beginner level.', phase: 'Phase 4' },
  { icon: '✓', title: 'Smart Quizzes', desc: 'Topic questions, explanations, scores and review.', phase: 'Phase 5' },
  { icon: '◈', title: 'Assessments', desc: 'Chapter exams and coding challenges.', phase: 'Phase 6' },
  { icon: '↗', title: 'Advanced Mentoring', desc: 'Personalized revision and code optimization.', phase: 'Phase 9' }
];

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [data, setData] = useState<Bootstrap | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [selected, setSelected] = useState('python-hello');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [aiError, setAiError] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiMode, setAiMode] = useState<AiMode>('chat');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCode, setAiCode] = useState('');
  const [aiLanguage, setAiLanguage] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiDepth, setAiDepth] = useState<AiDepth>('balanced');
  const [streamPreview, setStreamPreview] = useState('');
  const streamTextRef = useRef('');
  const [warmupNotice, setWarmupNotice] = useState('');
  const warmupSent = useRef(new Set<string>());
  const currentModel = useRef('');
  const [aiTurns, setAiTurns] = useState<AiTurn[]>([]);
  const pendingAi = useRef<{ id: string; turn: AiTurn } | null>(null);
  const requestCounter = useRef(0);
  const conversationListRef = useRef<HTMLDivElement>(null);
  const [previewQuestion, setPreviewQuestion] = useState('');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const questionIndex = buildQuestionIndex(aiTurns);
  currentModel.current = aiModel;

  useEffect(() => {
    if (page !== 'ai' || !aiStatus?.online || !aiModel || warmupSent.current.has(aiModel)) return;
    warmupSent.current.add(aiModel);
    setWarmupNotice('Preparing selected model in the background while you type…');
    vsCode?.postMessage({ type: 'aiWarmup', model: aiModel });
  }, [page, aiStatus?.online, aiModel]);

  function jumpToQuestion(index: number) {
    const list = conversationListRef.current;
    const target = list?.querySelector<HTMLElement>(`[data-ai-question-index="${index}"]`);
    if (!list || !target) return;
    const top = target.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop - 12;
    list.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    setActiveQuestionIndex(index);
  }

  function refreshModels() {
    setAiError('');
    vsCode?.postMessage({ type: 'aiStatus' });
  }

  function sendToSensei() {
    if (pendingAi.current || !aiStatus?.online || !aiModel) return;
    const prompt = aiPrompt.trim();
    const code = aiCode.trim();
    if (!prompt && !code) { setAiError('Enter a question or code first.'); return; }
    if ((aiMode === 'explain' || aiMode === 'debug') && !code) {
      setAiError('Paste or select code for Explain/Debug modes.'); return;
    }
    const id = `ai-${++requestCounter.current}`;
    const turn: AiTurn = { role: 'user', content: code ? `${prompt || aiMode}\n\n${code}` : prompt, mode: aiMode };
    pendingAi.current = { id, turn };
    setAiBusy(true);
    streamTextRef.current = '';
    setStreamPreview('');
    setAiError('');
    const history = aiMode === 'chat' ? aiTurns.slice(-8).map(t => ({role: t.role, content: t.content.slice(0, 3000)})) : [];
    vsCode?.postMessage({ type: 'aiChatStream', requestId: id,
      payload: { model: aiModel, mode: aiMode, prompt, code, language: aiLanguage.trim(), history, depth: aiDepth } });
  }

  function reload() {
    setError('');
    vsCode?.postMessage({ type: 'bootstrap' });
  }

  useEffect(() => {
    function handler(event: MessageEvent) {
      const message = event.data;
      if (!message || typeof message !== 'object') return;
      if (message.type === 'bootstrap') {
        const bootstrap = message.data as Bootstrap;
        setData(bootstrap);
        setProgress(bootstrap.progress);
        setError('');
        setPending(null);
      } else if (message.type === 'progress') {
        const payload = message.data as { progress: Progress };
        setProgress(payload.progress);
        setPending(null);
        setError('');
      } else if (message.type === 'aiStatus') {
        const status = message.data as AiStatus;
        setAiStatus(status);
        setAiModel(previous => status.models.includes(previous) ? previous : (status.preferred_model ?? ''));
        if (status.online) setAiError('');
      } else if (message.type === 'aiWarmup') {
        const data = message.data as { model?: string; state?: string };
        if (data.model === currentModel.current && data.state === 'ready') {
          setWarmupNotice('Selected model is prepared for faster follow-up answers.');
        }
      } else if (message.type === 'aiWarmupError') {
        setWarmupNotice('Automatic model preparation was unavailable; you can still use Ask Sensei.');
      } else if (message.type === 'aiChunk') {
        if (!pendingAi.current || pendingAi.current.id !== message.requestId) return;
        if (typeof message.text !== 'string') return;
        streamTextRef.current += message.text;
        setStreamPreview(streamTextRef.current);
      } else if (message.type === 'aiResponse') {
        const request = pendingAi.current;
        if (!request || request.id !== message.requestId) return;
        const data = message.data as { reply: string; model: string; mode: AiMode };
        pendingAi.current = null;
        streamTextRef.current = '';
        setStreamPreview('');
        setAiTurns(previous => [...previous, request.turn,
          { role: 'assistant', content: data.reply, model: data.model, mode: data.mode }]);
        setAiBusy(false);
        setAiPrompt('');
      } else if (message.type === 'aiError') {
        if (message.requestId && message.requestId !== pendingAi.current?.id) return;
        const request = pendingAi.current;
        if (request && streamTextRef.current.trim()) {
          const partial = streamTextRef.current.trim() + '\n\n*This reply was interrupted before completion.*';
          setAiTurns(previous => [...previous, request.turn,
            { role: 'assistant', content: partial, model: 'Interrupted local response', mode: request.turn.mode }]);
        }
        pendingAi.current = null;
        streamTextRef.current = '';
        setStreamPreview('');
        setAiBusy(false);
        setAiError(String(message.message || 'The local AI request failed.'));
      } else if (message.type === 'editorSelection') {
        const selection = message.data as { code?: string; language?: string };
        if (typeof selection.code === 'string') {
          setAiCode(selection.code);
          setAiLanguage(typeof selection.language === 'string' ? selection.language : '');
          setAiMode('explain');
          setPage('ai');
          setAiError('');
        }
      } else if (message.type === 'error') {
        setPending(null);
        setError(String(message.message || 'Unknown backend error'));
      }
    }
    window.addEventListener('message', handler);
    vsCode?.postMessage({ type: 'bootstrap' });
    vsCode?.postMessage({ type: 'aiStatus' });
    return () => window.removeEventListener('message', handler);
  }, []);

  function toggle(lesson: Lesson) {
    if (!progress || pending) return;
    setPending(lesson.id);
    const completed = !isLessonComplete(progress, lesson.id);
    vsCode?.postMessage({ type: 'updateProgress', lessonId: lesson.id, completed });
  }

  const currentLesson = data?.lessons.find(item => item.id === selected) ?? data?.lessons[0];
  const percent = progress ? completionPercentage(progress) : 0;

  return <div className="shell">
    <header className="topbar">
      <div className="brand"><span className="mark">&lt;/&gt;</span><div><strong>Syntax-Sensei</strong><small>Learn. Build. Level up.</small></div></div>
      <span className="phase-chip">OFFLINE AI · PHASE 02</span>
    </header>
    <div className="workspace">
      <aside className="sidebar">
        <p className="section-label">WORKSPACE</p>
        <nav aria-label="Syntax-Sensei navigation">
          <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}><span>▦</span> Overview</button>
          <button className={page === 'ai' ? 'active' : ''} onClick={() => setPage('ai')}><span>✦</span> AI Sensei</button>
          <button className={page === 'learn' ? 'active' : ''} onClick={() => setPage('learn')}><span>▤</span> Learn Python</button>
          <button className={page === 'progress' ? 'active' : ''} onClick={() => setPage('progress')}><span>◷</span> My Progress</button>
          <button className={page === 'roadmap' ? 'active' : ''} onClick={() => setPage('roadmap')}><span>♢</span> Roadmap</button>
        </nav>
        <div className="sidebar-footer"><span className="signal"></span> Local Ollama + SQLite <small>No cloud AI service required</small></div>
      </aside>
      <main className="main">
        {error && <section className="error" role="alert"><strong>Connection or save error</strong><p>{error}</p><p>Check VS Code → View → Output → Syntax-Sensei.</p><button onClick={reload}>Retry connection</button></section>}
        {!data ? <section className="loading"><div className="spinner"></div><h2>Starting your workspace</h2><p>{vsCode ? 'Connecting to the local Python service...' : 'Open this page inside the VS Code extension.'}</p><button onClick={reload}>Retry</button></section> : <>
          {page === 'dashboard' && <>
            <div className="eyebrow">WELCOME TO YOUR WORKSPACE</div>
            <h1>Meet your coding mentor<span className="dot">.</span></h1>
            <p className="lead">A focused place to understand code, learn languages and build confidence. Your workspace now includes a local AI coding mentor while keeping all Phase 1 lessons and progress.</p>
            <div className="hero-panel">
              <div><span className="kicker">YOUR FIRST MILESTONE</span><h2>Learn with an offline AI mentor.</h2><p>Ask about programming, explain code, or practice the Python preview lessons. Ollama inference stays on your computer.</p><button className="primary" onClick={() => setPage('learn')}>Open learning preview <span>→</span></button></div>
              <div className="big-code" aria-hidden="true"><span className="line-no">01</span> <span className="violet">def</span> learn():<br/><span className="line-no">02</span> &nbsp; <span className="green">return</span> <span className="yellow">"You got this!"</span><br/><span className="line-no">03</span> <span className="violet">print</span>(learn())</div>
            </div>
            <div className="stat-grid">
              <div className="stat"><span>LESSONS COMPLETED</span><strong>{progress?.completed_count ?? 0}<em> / {progress?.total_lessons ?? 0}</em></strong><small>Learning preview</small></div>
              <div className="stat"><span>PREVIEW PROGRESS</span><strong>{percent}<em>%</em></strong><div className="meter"><div style={{ width: `${percent}%` }}/></div></div>
              <div className="stat"><span>BACKEND STATUS</span><strong className="online">● Connected</strong><small>FastAPI + SQLite · Local</small></div>
            </div>
            <div className="section-heading"><h2>Get started</h2><span>Local AI + learning preview</span></div>
            <button className="primary" onClick={() => setPage('ai')}>Open AI Sensei →</button>
            <div className="features">{planned.slice(0,4).map(f => <div className="feature" key={f.title}><div className="feature-icon">{f.icon}</div><strong>{f.title}</strong><p>{f.desc}</p><small>{f.phase} · Planned</small></div>)}</div>
          </>}
          {page === 'ai' && <>
            <div className="eyebrow">LOCAL AI CODING MENTOR</div>
            <h1>Ask Syntax-Sensei<span className="dot">.</span></h1>
            <p className="lead">Chat about programming, explain your code, investigate possible bugs, or ask for a hint. Your prompts go only to the Ollama service running on this computer.</p>
            <section className="ai-statusbar" aria-label="Ollama status">
              <div><span className={aiStatus?.online ? 'ai-dot ai-connected' : 'ai-dot'}></span><strong>{!aiStatus ? 'Checking Ollama...' : aiStatus.online ? 'Ollama connected locally' : 'Ollama disconnected'}</strong><small>{aiStatus?.message ?? 'Reading installed models from 127.0.0.1:11434...'}</small></div>
              <button className="secondary ai-refresh" onClick={refreshModels}>↻ Refresh models</button>
            </section>
            {warmupNotice && <p className="ai-warmup-note" role="status">{warmupNotice}</p>}
            <div className="ai-panel">
              <div className="ai-form">
                <div className="ai-input-row">
                  <label className="ai-label">Installed model<select aria-label="Installed Ollama model" value={aiModel} onChange={e => setAiModel(e.target.value)} disabled={aiBusy || !aiStatus?.online || !aiStatus.models.length}><option value="">{aiStatus?.models.length ? 'Choose a model' : 'No local models available'}</option>{(aiStatus?.models ?? []).map(m => <option key={m} value={m}>{m}</option>)}</select></label>
                  <label className="ai-label">Mode<select aria-label="AI assistance mode" value={aiMode} onChange={e => setAiMode(e.target.value as AiMode)} disabled={aiBusy}>{aiModes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
                </div>
                <label className="ai-label ai-depth-label" htmlFor="ai-depth">Answer depth
                  <select id="ai-depth" value={aiDepth} disabled={aiBusy} onChange={e => setAiDepth(e.target.value as AiDepth)}>
                    <option value="quick">Quick — shorter, code example included</option>
                    <option value="balanced">Balanced — recommended</option>
                    <option value="detailed">Detailed — comprehensive, slower</option>
                  </select>
                </label>
                <p className="ai-mode-help">{aiModes.find(m => m.value === aiMode)?.description}</p>
                <label className="ai-label" htmlFor="ai-question">Your question</label>
                <textarea id="ai-question" className="ai-textarea" maxLength={5000} rows={3} value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} disabled={aiBusy} placeholder={aiMode === 'chat' ? 'How do Python functions work?' : aiMode === 'hint' ? 'I am stuck writing a sorting algorithm...' : 'Explain what I should understand about this code...'} />
                <div className="ai-code-title"><label className="ai-label" htmlFor="ai-code">Code (optional for Chat/Hints)</label><small>Or select code in the editor and run “Syntax-Sensei: Explain Selected Code”</small></div>
                <textarea id="ai-code" className="ai-textarea ai-code" maxLength={12000} rows={6} value={aiCode} onChange={e => setAiCode(e.target.value)} disabled={aiBusy} placeholder="Paste a small code sample here..." spellCheck={false}/>
                <label className="ai-label ai-language" htmlFor="ai-language">Programming language (optional)<input id="ai-language" maxLength={60} value={aiLanguage} onChange={e => setAiLanguage(e.target.value)} disabled={aiBusy} placeholder="Python, Java, C++, R..." /></label>
                {aiError && <div className="ai-error" role="alert"><strong>AI request issue</strong><p>{aiError}</p></div>}
                <div className="ai-actions"><button className="primary" disabled={aiBusy || !aiStatus?.online || !aiModel} onClick={sendToSensei}>{aiBusy ? 'Thinking locally...' : 'Ask Sensei →'}</button><button className="secondary" disabled={aiBusy || !aiTurns.length} onClick={() => { setAiTurns([]); setPreviewQuestion(''); setActiveQuestionIndex(null); }}>Clear chat</button></div>
                <p className="ai-note">Review selected code before sending. Do not include passwords or secrets. No files are read automatically. AI answers can be wrong; code is not executed. Answers appear progressively as the local model generates them. Quick mode can finish sooner; detailed mode uses more tokens. First loading can still take time on an 8 GB PC.</p>
              </div>
              <div className="ai-conversation">
                <div className="ai-convo-head"><strong>Conversation</strong><small>Session only · Questions at right</small></div>
                {questionIndex.length > 0 && <div className="ai-jump-preview" title={previewQuestion || 'Hover over a question line to preview it'}>
                  {previewQuestion || `Question map · ${questionIndex.length} question${questionIndex.length === 1 ? '' : 's'} · hover a line, click to jump`}
                </div>}
                <div className="ai-message-split">
                  <div className="ai-message-list" ref={conversationListRef} aria-label="AI conversation" aria-live="polite">
                    {!aiTurns.length && <div className="ai-empty"><div>✦</div><h3>Your coding mentor is ready.</h3><p>Select a local model, choose a mode and ask your first question. No cloud account or API key is needed.</p></div>}
                    {aiTurns.map((turn, index) => <article className={`ai-turn ${turn.role}`} data-ai-question-index={turn.role === 'user' ? index : undefined} key={index}><div className="ai-turn-top"><strong>{turn.role === 'user' ? 'You' : 'Syntax-Sensei'}</strong><small>{turn.role === 'user' ? aiModes.find(m => m.value === turn.mode)?.label : turn.model}</small></div>{turn.role === 'assistant' ? <MarkdownAnswer content={turn.content} /> : <div className="ai-user-text">{turn.content}</div>}</article>)}
                    {aiBusy && <article className="ai-turn assistant ai-streaming" aria-label="AI response in progress">
                      <div className="ai-turn-top"><strong>Syntax-Sensei</strong><small>Responding live · {aiDepth}</small></div>
                      {streamPreview ? <MarkdownAnswer content={streamPreview} /> : <div className="ai-pending"><div className="spinner"></div> Preparing the first words locally…</div>}
                      <div className="ai-streaming-footer"><span className="ai-streaming-dot" /> Generating locally — response is not complete</div>
                    </article>}
                  </div>
                  {questionIndex.length > 0 && <nav className="ai-question-map" aria-label="Jump to earlier questions">
                    <span className="ai-map-caption" aria-hidden="true">Q</span>
                    {questionIndex.map(entry => <button key={entry.turnIndex} type="button"
                      className={`ai-map-tick ${activeQuestionIndex === entry.turnIndex ? 'active' : ''}`}
                      aria-label={`Jump to question ${entry.number}: ${entry.preview}`}
                      aria-current={activeQuestionIndex === entry.turnIndex ? 'location' : undefined}
                      title={`Question ${entry.number}: ${entry.preview}`}
                      onMouseEnter={() => setPreviewQuestion(`Q${entry.number} · ${entry.preview}`)}
                      onMouseLeave={() => setPreviewQuestion('')}
                      onFocus={() => setPreviewQuestion(`Q${entry.number} · ${entry.preview}`)}
                      onBlur={() => setPreviewQuestion('')}
                      onClick={() => jumpToQuestion(entry.turnIndex)}>
                        <span className="ai-map-line" aria-hidden="true" />
                      </button>)}
                  </nav>}
                </div>
              </div>
            </div>
          </>}
          {page === 'learn' && <>
            <div className="eyebrow">PYTHON LEARNING PREVIEW</div><h1>Small steps. Real progress<span className="dot">.</span></h1>
            <p className="lead">These three introductory lessons demonstrate the lesson viewer and persistent completion tracking. Full courses and quizzes arrive later.</p>
            <div className="lesson-layout">
              <div className="lesson-picker"><div className="section-label">PREVIEW LESSONS</div>{data.lessons.map((lesson, index) => <button key={lesson.id} className={selected === lesson.id ? 'picked' : ''} onClick={() => setSelected(lesson.id)}><span className="lesson-index">{String(index+1).padStart(2,'0')}</span><span><strong>{lesson.title}</strong><small>{lesson.duration_minutes} min · {lesson.level}</small></span>{progress && isLessonComplete(progress,lesson.id) ? <span className="completed-symbol">✓</span> : null}</button>)}</div>
              {currentLesson && <article className="lesson-card"><div className="lesson-meta">{currentLesson.language} · {currentLesson.level} · {currentLesson.duration_minutes} min</div><h2>{currentLesson.title}</h2><p className="lesson-desc">{currentLesson.description}</p><div className="code-label">EXAMPLE CODE</div><pre><code>{currentLesson.code}</code></pre><h3>Step-by-step explanation</h3><ol>{currentLesson.explanation.map((step, i) => <li key={i}>{step}</li>)}</ol><div className="output"><span>EXPECTED OUTPUT</span><code>{currentLesson.expected_output}</code></div><button className="primary" disabled={pending !== null} onClick={() => toggle(currentLesson)}>{pending === currentLesson.id ? 'Saving...' : progress && isLessonComplete(progress, currentLesson.id) ? '✓ Completed — click to undo' : 'Mark lesson complete'}</button></article>}
            </div>
          </>}
          {page === 'progress' && <>
            <div className="eyebrow">YOUR LEARNING JOURNEY</div><h1>Progress, saved locally<span className="dot">.</span></h1><p className="lead">Close and reopen VS Code. Your completed lessons should stay checked — that's our SQLite persistence acceptance test.</p>
            <div className="progress-card"><div className="progress-top"><div><span>PYTHON FOUNDATION PREVIEW</span><h2>{percent}% complete</h2></div><strong>{progress?.completed_count ?? 0} / {progress?.total_lessons ?? 0}</strong></div><div className="meter large"><div style={{width: `${percent}%`}}/></div>{data.lessons.map((lesson, index) => <div className="progress-line" key={lesson.id}><span>{String(index+1).padStart(2,'0')}</span><strong>{lesson.title}</strong><b className={progress && isLessonComplete(progress,lesson.id) ? 'done-text' : ''}>{progress && isLessonComplete(progress,lesson.id) ? 'Completed' : 'Not started'}</b></div>)}</div>
            <button className="secondary" onClick={() => setPage('learn')}>Continue learning →</button>
          </>}
          {page === 'roadmap' && <><div className="eyebrow">OUR DEVELOPMENT JOURNEY</div><h1>Built carefully, phase by phase<span className="dot">.</span></h1><p className="lead">Features are clearly labeled by delivery status so you always know what actually works.</p><div className="roadmap-list"><div className="roadmap-item ready"><span>01</span><div><strong>Extension + API + SQLite</strong><p>Development foundation, learning preview, progress persistence</p></div><b>PHASE 1 · DONE</b></div><div className="roadmap-item ready"><span>02</span><div><strong>Offline Ollama AI Integration</strong><p>Local AI chat, model switching, code explanations, debugging hints</p></div><b>THIS PHASE</b></div>{planned.map((f,i)=><div className="roadmap-item" key={f.title}><span>{String(i+3).padStart(2,'0')}</span><div><strong>{f.title}</strong><p>{f.desc}</p></div><b>PLANNED</b></div>)}</div></>}
        </>}
        <footer className="footer"><span>SYNTAX-SENSEI / v0.2.0</span><span>Ollama local-only · AI chat not saved to SQLite</span></footer>
      </main>
    </div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
