import { useState, useMemo, useEffect, useCallback } from 'react';
import { StatCard, Spinner } from '../components/ui/Primitives';
import { Button } from '../components/ui/Button';
import { BugTable } from '../components/bugs/BugTable';
import { BugFilters } from '../components/bugs/BugFilters';
import { bugsApi } from '../api/bugs.api.js';
import { searchApi } from '../api/search.api.js';
import { smartSearch } from '../utils/search.js';

const computeStats = (bugs) => ({
  total:      bugs.length,
  open:       bugs.filter(b => b.status === 'open').length,
  inProgress: bugs.filter(b => b.status === 'in-progress').length,
  resolved:   bugs.filter(b => b.status === 'resolved').length,
  critical:   bugs.filter(b => b.priority === 'critical').length,
});

export const DashboardPage = ({ bugs, onBugsChange, onNavigateBug, onNavigateCreate, onDeleteBug }) => {
  const [filters,       setFilters]       = useState({ status: 'all', priority: 'all', team: 'all', search: '' });
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [searching,     setSearching]     = useState(false);

  const handleFilterChange = (update) => setFilters(f => ({ ...f, ...update }));

  // Semantic search — debounced, hits real backend
  useEffect(() => {
    if (!filters.search.trim()) { setSearchResults(null); return; }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchApi.semantic(filters.search);
        setSearchResults(data.bugs || []);
      } catch {
        // Fallback to client-side search if API fails
        setSearchResults(smartSearch(bugs, filters.search, filters));
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [filters.search, bugs]);

  // Apply hard filters on top of search results (or all bugs)
  const filteredBugs = useMemo(() => {
    const base = searchResults ?? bugs;
    return smartSearch(base, '', filters); // filters only, no text scoring
  }, [bugs, searchResults, filters]);

  const stats = useMemo(() => computeStats(bugs), [bugs]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Bug Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">{stats.total} issues tracked across all teams</p>
          </div>
          <Button variant="primary" size="sm" onClick={onNavigateCreate}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
            Report Bug
          </Button>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <StatCard label="Total"       value={stats.total}      accent="slate" />
          <StatCard label="Open"        value={stats.open}       sublabel="needs attention" accent="blue" />
          <StatCard label="In Progress" value={stats.inProgress} sublabel="being worked on" accent="violet" />
          <StatCard label="Resolved"    value={stats.resolved}   sublabel="this month"      accent="emerald" />
          <StatCard label="Critical"    value={stats.critical}   sublabel="high priority"   accent="red" />
        </div>
      </div>

      <BugFilters filters={filters} onChange={handleFilterChange} resultCount={filteredBugs.length} />

      <div className="flex-1 overflow-auto relative">
        {searching && (
          <div className="absolute top-3 right-6 flex items-center gap-2 text-xs text-slate-400 z-10">
            <Spinner size="xs" /> Searching...
          </div>
        )}
        <BugTable bugs={filteredBugs} onRowClick={onNavigateBug} onDelete={onDeleteBug} />
      </div>
    </div>
  );
};
