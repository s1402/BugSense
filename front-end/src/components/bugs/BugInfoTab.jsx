import { useState, useEffect } from 'react';
import { Card, Select, Textarea } from '../ui/Primitives';
import { Button } from '../ui/Button';
import { COMPONENTS } from '../../data/mockBugs';

const fmtDateTime = (iso) => new Date(iso).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

const EditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

export const BugInfoTab = ({ bug, onFieldUpdate }) => {
  // ── Description editing ──
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft]     = useState(bug.description);
  const [savingDesc, setSavingDesc]   = useState(false);

  // ── Component editing ──
  const [editingComp, setEditingComp] = useState(false);
  const [compDraft, setCompDraft]     = useState(bug.component);
  const [savingComp, setSavingComp]   = useState(false);

  // Sync drafts when bug prop updates (live update / navigation)
  useEffect(() => { setDescDraft(bug.description); }, [bug.description]);
  useEffect(() => { setCompDraft(bug.component); }, [bug.component]);

  const saveDescription = async () => {
    if (descDraft.trim() === bug.description) { setEditingDesc(false); return; }
    setSavingDesc(true);
    try {
      await onFieldUpdate('description', descDraft.trim());
      setEditingDesc(false);
    } catch (err) {
      console.error('Description update failed:', err.message);
    } finally {
      setSavingDesc(false);
    }
  };

  const saveComponent = async () => {
    if (compDraft === bug.component) { setEditingComp(false); return; }
    setSavingComp(true);
    try {
      await onFieldUpdate('component', compDraft);
      setEditingComp(false);
    } catch (err) {
      console.error('Component update failed:', err.message);
    } finally {
      setSavingComp(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Description ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</h3>
          {!editingDesc && (
            <button onClick={() => setEditingDesc(true)}
              className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer p-1 rounded hover:bg-slate-50">
              <EditIcon />
            </button>
          )}
        </div>
        {editingDesc ? (
          <div className="space-y-3">
            <Textarea value={descDraft} onChange={e => setDescDraft(e.target.value)} rows={4} />
            <div className="flex gap-2">
              <Button variant="primary" size="xs" onClick={saveDescription} loading={savingDesc}>Save</Button>
              <Button variant="ghost" size="xs" onClick={() => { setDescDraft(bug.description); setEditingDesc(false); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-700 leading-relaxed">{bug.description}</p>
        )}
      </Card>

      {/* ── Logs ── */}
      {bug.logs && (
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Stack Trace / Logs</h3>
          <pre className="text-xs font-mono text-slate-600 bg-slate-50 rounded-lg p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap border border-slate-100">
            {bug.logs}
          </pre>
        </Card>
      )}

      {/* ── Details ── */}
      <Card className="p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Details</h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4">

          {/* Component — editable */}
          <div>
            <dt className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              Component
              {!editingComp && (
                <button onClick={() => setEditingComp(true)}
                  className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
                  <EditIcon />
                </button>
              )}
            </dt>
            {editingComp ? (
              <div className="mt-1 space-y-2">
                <Select value={compDraft} onChange={e => setCompDraft(e.target.value)}>
                  {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                <div className="flex gap-2">
                  <Button variant="primary" size="xs" onClick={saveComponent} loading={savingComp}>Save</Button>
                  <Button variant="ghost" size="xs" onClick={() => { setCompDraft(bug.component); setEditingComp(false); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <dd className="text-sm text-slate-800 mt-0.5 font-medium">{bug.component}</dd>
            )}
          </div>

          {/* Team — read-only, shows assignee in brackets */}
          <div>
            <dt className="text-xs text-slate-400 font-medium">Team</dt>
            <dd className="text-sm text-slate-800 mt-0.5 font-medium">
              {bug.team
                ? `${bug.team}${bug.assignee ? ` (${bug.assignee})` : ''}`
                : '—'}
            </dd>
          </div>

          {/* Created */}
          <div>
            <dt className="text-xs text-slate-400 font-medium">Created</dt>
            <dd className="text-sm text-slate-800 mt-0.5 font-medium">{fmtDateTime(bug.createdAt)}</dd>
          </div>

          {/* Updated */}
          <div>
            <dt className="text-xs text-slate-400 font-medium">Updated</dt>
            <dd className="text-sm text-slate-800 mt-0.5 font-medium">{fmtDateTime(bug.updatedAt)}</dd>
          </div>
        </dl>

        {/* Tags */}
        {bug.tags?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {bug.tags.map(tag => (
                <span key={tag} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
