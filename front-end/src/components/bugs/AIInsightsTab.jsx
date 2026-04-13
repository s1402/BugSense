import { useState, useEffect } from 'react';
import { Card, ConfidenceBar, Select } from '../ui/Primitives';
import { Button } from '../ui/Button';
import { PriorityBadge } from '../ui/Badge';
import { SEVERITIES } from '../../data/mockBugs';

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('') ?? '?';

const EmbeddingViz = () => (
  <Card className="p-5">
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Embedding Similarity Space</h3>
    <div className="relative h-44 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="absolute w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-lg" style={{ left: '45%', top: '42%', transform: 'translate(-50%,-50%)' }}>
        <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-30" />
      </div>
      {[{l:'37%',t:'34%',c:'bg-violet-400'},{l:'53%',t:'49%',c:'bg-violet-300'},{l:'61%',t:'29%',c:'bg-slate-300'},{l:'27%',t:'61%',c:'bg-slate-200'},{l:'71%',t:'56%',c:'bg-slate-200'}]
        .map((d, i) => <div key={i} className={`absolute w-3 h-3 ${d.c} rounded-full border-2 border-white shadow`} style={{ left:d.l, top:d.t, transform:'translate(-50%,-50%)' }} />)}
      <div className="absolute bottom-2 left-3 flex items-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-600 rounded-full" /> This bug</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-violet-400 rounded-full" /> Similar</span>
      </div>
    </div>
    <p className="text-xs text-slate-400 mt-2">Proximity = semantic similarity. Powered by vector embeddings + cosine similarity.</p>
  </Card>
);

export const AIInsightsTab = ({ bug, users = [], onOverride }) => {
  const [showForm, setShowForm]           = useState(false);
  const [overridePriority, setOP]         = useState(bug.priority);
  const [overrideAssignee, setOA]         = useState(bug.assignee || '');
  const [saved, setSaved]                 = useState(false);

  // Sync form values when bug prop updates (e.g. after save or live update)
  useEffect(() => {
    setOP(bug.priority);
    setOA(bug.assignee || '');
    setSaved(false);
  }, [bug.priority, bug.assignee]);

  const ai = bug.ai;
  const pct = ai ? Math.round(ai.confidenceScore * 100) : 0;
  const confColor = pct >= 90 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : pct >= 75 ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-amber-600 bg-amber-50 border-amber-200';

  const handleSave = () => {
    onOverride({ priority: overridePriority, assignee: overrideAssignee });
    setShowForm(false);
    setSaved(true);
  };

  if (!ai) return <p className="text-sm text-slate-400 p-4">No AI data available.</p>;

  return (
    <div className="space-y-5">
      {bug.aiOverridden && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          AI decision has been manually overridden.
        </div>
      )}

      <Card className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Confidence</h3>
          <span className={`text-lg font-bold px-3 py-0.5 rounded-lg border ${confColor}`}>{pct}%</span>
        </div>
        <ConfidenceBar score={ai.confidenceScore} />
        <p className="text-xs text-slate-400 mt-2">{pct >= 90 ? 'High confidence — strong historical match.' : pct >= 75 ? 'Good confidence — reasonable evidence.' : 'Moderate — review suggestions carefully.'}</p>
      </Card>

      <Card className="p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">AI Reasoning</h3>
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{ai.reason}</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Suggested Priority</h3>
          <PriorityBadge priority={ai.suggestedPriority} />
          {ai.suggestedPriority !== bug.priority && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-2 py-1 rounded">⚠ Current: <strong>{bug.priority}</strong></p>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Suggested Assignee</h3>
          {ai.suggestedAssignee ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold">{getInitials(ai.suggestedAssignee)}</div>
              <div><p className="text-sm font-semibold text-slate-800">{ai.suggestedAssignee}</p><p className="text-xs text-slate-400">{ai.suggestedTeam}</p></div>
            </div>
          ) : <span className="text-sm text-slate-400">No suggestion</span>}
        </Card>
      </div>

      {ai.similarBugs?.length > 0 && (
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Similar Bugs <span className="ml-2 bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full">{ai.similarBugs.length}</span></h3>
          <div className="space-y-2">
            {ai.similarBugs.map(id => (
              <div key={id} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span className="text-xs font-mono font-medium text-violet-700">{id}</span>
                <span className="text-xs text-slate-400">High semantic similarity</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <EmbeddingViz />

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {bug.aiOverridden ? 'Edit Priority & Assignee' : 'Override AI Decision'}
          </h3>
          {saved && !showForm && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
        </div>
        {!showForm ? (
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500 flex-1">
              {bug.aiOverridden
                ? 'AI was overridden. You can continue editing priority and assignee.'
                : 'Disagree with AI suggestions? Override helps improve future predictions.'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
              {bug.aiOverridden ? 'Edit' : 'Override'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select label="Priority" value={overridePriority} onChange={e => setOP(e.target.value)}>
                {SEVERITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
              <Select label="Assignee" value={overrideAssignee} onChange={e => setOA(e.target.value)}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};