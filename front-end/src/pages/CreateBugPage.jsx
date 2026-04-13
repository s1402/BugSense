import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select, Card, Spinner } from '../components/ui/Primitives';
import { DuplicateWarning } from '../components/bugs/DuplicateWarning';
import { useDuplicateDetection } from '../hooks/useDuplicateDetection.js';
import { bugsApi } from '../api/bugs.api.js';
import { COMPONENTS, TEAMS } from '../data/mockBugs.js';

export const CreateBugPage = ({ bugs, onBack, onCreate, onViewBug }) => {
  const [form,     setForm]     = useState({ title: '', description: '', logs: '', component: '', team: '' });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState(null);

  const { similar, isChecking } = useDuplicateDetection(form.title, bugs);
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())          e.title       = 'Title is required';
    else if (form.title.length < 10) e.title       = 'Be more descriptive (10+ chars)';
    if (!form.description.trim())    e.description = 'Description is required';
    if (!form.component)             e.component   = 'Select a component';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setApiError(null);
    setLoading(true);
    try {
      const data = await bugsApi.create({
        title:       form.title,
        description: form.description,
        logs:        form.logs,
        component:   form.component,
        team:        form.team,
      });
      onCreate(data.bug);
    } catch (err) {
      setApiError(err.message || 'Failed to create bug. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Report a Bug</h1>
            <p className="text-xs text-slate-500">AI will determine priority, assignee, tags, and root cause automatically</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        <Card className="p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded text-xs flex items-center justify-center font-bold">1</span>
            Bug Details
          </h2>
          <div>
            <Input label="Title" value={form.title} onChange={set('title')}
              placeholder="e.g. Login fails on Safari after OAuth redirect" error={errors.title} />
            <DuplicateWarning similar={similar} isChecking={isChecking} onViewBug={onViewBug} />
          </div>
          <Textarea label="Description" value={form.description} onChange={set('description')}
            placeholder="What happened? Steps to reproduce, expected vs actual behavior, affected users..." rows={4} error={errors.description} />
          <Textarea label="Logs / Stack Trace" value={form.logs} onChange={set('logs')}
            placeholder="Paste error logs, stack traces, or console output — the more detail, the better AI analysis..." rows={4} className="font-mono text-xs" />
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded text-xs flex items-center justify-center font-bold">2</span>
            Classification
          </h2>
          <Select label="Component" value={form.component} onChange={set('component')} error={errors.component}>
            <option value="">Select component...</option>
            {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Team (optional — AI will detect from component)" value={form.team} onChange={set('team')}>
            <option value="">Let AI decide</option>
            {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>

          {/* Fields AI will predict */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { label: 'Priority',   icon: '🎯', note: 'AI predicted' },
              { label: 'Assignee',   icon: '👤', note: 'AI predicted' },
              { label: 'Root Cause', icon: '🔍', note: 'AI predicted' },
            ].map(({ label, icon, note }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                <span className="text-lg">{icon}</span>
                <p className="text-xs font-semibold text-slate-600">{label}</p>
                <p className="text-xs text-indigo-500 font-medium">{note}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-900">How AI triage works</p>
            <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
              Embeds your bug → searches similar past bugs via Qdrant vector search →
              passes full context to Groq LLM → predicts <strong>priority, assignee, team, tags, and root cause</strong>.
              Bug saves instantly, AI updates in ~5 seconds via live notification.
            </p>
          </div>
        </div>

        {apiError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-xs text-red-700">{apiError}</p>
          </div>
        )}

        <div className="flex items-center justify-between pb-8">
          <Button variant="secondary" onClick={onBack} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {loading ? 'Creating...' : 'Submit — Let AI Triage'}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl max-w-sm w-full mx-4 text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto">
              <Spinner size="md" />
            </div>
            <h3 className="font-bold text-slate-900">Saving your bug report</h3>
            <p className="text-sm text-slate-500">AI pipeline starts in background after save...</p>
          </div>
        </div>
      )}
    </div>
  );
};
