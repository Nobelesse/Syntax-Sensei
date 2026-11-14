import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { completionPercentage, isLessonComplete, type Bootstrap, type Progress, type Lesson } from './progress';
import './style.css';

type Page = 'dashboard' | 'learn' | 'progress' | 'roadmap';
type VsCodeApi = { postMessage(message: object): void };

declare global {
  interface Window { acquireVsCodeApi?: () => VsCodeApi }
}
const vsCode = window.acquireVsCodeApi?.();

const planned = [
  { icon: '✦', title: 'AI Coding Assistant', desc: 'Private offline chat with your chosen Ollama model.', phase: 'Phase 2' },
  { icon: '{ }', title: 'Explain & Debug', desc: 'Explain code and help investigate issues right inside VS Code.', phase: 'Phase 3' },
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
      } else if (message.type === 'error') {
        setPending(null);
        setError(String(message.message || 'Unknown backend error'));
      }
    }
    window.addEventListener('message', handler);
    vsCode?.postMessage({ type: 'bootstrap' });
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
      <span className="phase-chip">FOUNDATION · PHASE 01</span>
    </header>
    <div className="workspace">
      <aside className="sidebar">
        <p className="section-label">WORKSPACE</p>
        <nav aria-label="Syntax-Sensei navigation">
          <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}><span>▦</span> Overview</button>
          <button className={page === 'learn' ? 'active' : ''} onClick={() => setPage('learn')}><span>▤</span> Learn Python</button>
          <button className={page === 'progress' ? 'active' : ''} onClick={() => setPage('progress')}><span>◷</span> My Progress</button>
          <button className={page === 'roadmap' ? 'active' : ''} onClick={() => setPage('roadmap')}><span>♢</span> Roadmap</button>
        </nav>
        <div className="sidebar-footer"><span className="signal"></span> Offline-first foundation <small>All progress stored locally</small></div>
      </aside>
      <main className="main">
        {error && <section className="error" role="alert"><strong>Connection or save error</strong><p>{error}</p><p>Check VS Code → View → Output → Syntax-Sensei.</p><button onClick={reload}>Retry connection</button></section>}
        {!data ? <section className="loading"><div className="spinner"></div><h2>Starting your workspace</h2><p>{vsCode ? 'Connecting to the local Python service...' : 'Open this page inside the VS Code extension.'}</p><button onClick={reload}>Retry</button></section> : <>
          {page === 'dashboard' && <>
            <div className="eyebrow">WELCOME TO YOUR WORKSPACE</div>
            <h1>Meet your coding mentor<span className="dot">.</span></h1>
            <p className="lead">A focused place to understand code, learn languages and build confidence. Your journey begins with a working local foundation.</p>
            <div className="hero-panel">
              <div><span className="kicker">YOUR FIRST MILESTONE</span><h2>Start with the fundamentals.</h2><p>Try three short Python preview lessons. Completion is saved in a real local SQLite database.</p><button className="primary" onClick={() => setPage('learn')}>Open learning preview <span>→</span></button></div>
              <div className="big-code" aria-hidden="true"><span className="line-no">01</span> <span className="violet">def</span> learn():<br/><span className="line-no">02</span> &nbsp; <span className="green">return</span> <span className="yellow">"You got this!"</span><br/><span className="line-no">03</span> <span className="violet">print</span>(learn())</div>
            </div>
            <div className="stat-grid">
              <div className="stat"><span>LESSONS COMPLETED</span><strong>{progress?.completed_count ?? 0}<em> / {progress?.total_lessons ?? 0}</em></strong><small>Phase 1 preview</small></div>
              <div className="stat"><span>PREVIEW PROGRESS</span><strong>{percent}<em>%</em></strong><div className="meter"><div style={{ width: `${percent}%` }}/></div></div>
              <div className="stat"><span>BACKEND STATUS</span><strong className="online">● Connected</strong><small>FastAPI + SQLite · Local</small></div>
            </div>
            <div className="section-heading"><h2>What we're building</h2><span>Upcoming phases</span></div>
            <div className="features">{planned.slice(0,4).map(f => <div className="feature" key={f.title}><div className="feature-icon">{f.icon}</div><strong>{f.title}</strong><p>{f.desc}</p><small>{f.phase} · Planned</small></div>)}</div>
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
          {page === 'roadmap' && <><div className="eyebrow">OUR DEVELOPMENT JOURNEY</div><h1>Built carefully, phase by phase<span className="dot">.</span></h1><p className="lead">Features are clearly labeled by delivery status so you always know what actually works.</p><div className="roadmap-list"><div className="roadmap-item ready"><span>01</span><div><strong>Extension + API + SQLite</strong><p>Development foundation, learning preview, progress persistence</p></div><b>THIS PHASE</b></div>{planned.map((f,i)=><div className="roadmap-item" key={f.title}><span>{String(i+2).padStart(2,'0')}</span><div><strong>{f.title}</strong><p>{f.desc}</p></div><b>PLANNED</b></div>)}</div></>}
        </>}
        <footer className="footer"><span>SYNTAX-SENSEI / v0.1.0</span><span>Private by design · No cloud connection in Phase 1</span></footer>
      </main>
    </div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
