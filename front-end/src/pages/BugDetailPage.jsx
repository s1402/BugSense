import { useState } from 'react';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { BugInfoTab } from '../components/bugs/BugInfoTab';
import { AIInsightsTab } from '../components/bugs/AIInsightsTab';
import { bugsApi } from '../api/bugs.api.js';

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const STATUSES = ['open', 'in-progress', 'resolved', 'closed'];

export const BugDetailPage = ({ bug, users = [], onBack, onBugUpdated }) => {
  const [activeTab,  setActiveTab]  = useState('info');
  const [updating,   setUpdating]   = useState(false);

  if (!bug) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <p className="text-slate-500 text-sm">Bug not found.</p>
      <button onClick={onBack} className="mt-3 text-sm text-indigo-600 hover:underline">← Back to dashboard</button>
    </div>
  );

  const handleStatusChange = async (status) => {
    setUpdating(true);
    try {
      const data = await bugsApi.update(bug._id, { status });
      onBugUpdated(data.bug);
    } catch (err) {
      console.error('Status update failed:', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleOverride = async (overrideData) => {
    setUpdating(true);
    try {
      const data = await bugsApi.update(bug._id, { ...overrideData, aiOverridden: true });
      onBugUpdated(data.bug);
    } catch (err) {
      console.error('Override failed:', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleFieldUpdate = async (field, value) => {
    setUpdating(true);
    try {
      const data = await bugsApi.update(bug._id, { [field]: value });
      onBugUpdated(data.bug);
    } catch (err) {
      console.error('Field update failed:', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const ai  = bug.ai;
  const pct = ai ? Math.round(ai.confidenceScore * 100) : null;
  const TABS = [
    { key: 'info', label: 'Bug Info' },
    { key: 'ai',   label: 'AI Insights', badge: pct ? `${pct}%` : null },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors mt-0.5 cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-semibold text-slate-400">{bug.bugId}</span>
              <PriorityBadge priority={bug.priority} />
              <StatusBadge status={bug.status} />
              {bug.aiOverridden && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">AI overridden</span>
              )}
            </div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">{bug.title}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs text-slate-400">{bug.component}</span>
              <span className="text-slate-200">·</span>
              <span className="text-xs text-slate-400">{bug.team}</span>
              <span className="text-slate-200">·</span>
              <span className="text-xs text-slate-400">{fmtDate(bug.createdAt)}</span>
            </div>
          </div>
          <select value={bug.status} onChange={e => handleStatusChange(e.target.value)}
            disabled={updating}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium flex-shrink-0 disabled:opacity-50 cursor-pointer">
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex">
          {TABS.map(({ key, label, badge }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer
                ${activeTab === key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {label}
              {badge && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                  ${activeTab === key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          {activeTab === 'info' && <BugInfoTab bug={bug} onFieldUpdate={handleFieldUpdate} />}
          {activeTab === 'ai'   && <AIInsightsTab bug={bug} users={users} onOverride={handleOverride} />}
        </div>
      </div>
    </div>
  );
};
