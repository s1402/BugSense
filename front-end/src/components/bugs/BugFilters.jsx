const STATUSES  = ['all', 'open', 'in-progress', 'resolved'];
const PRIORITIES = ['all', 'critical', 'high', 'medium', 'low'];
const TEAMS      = ['all', 'Frontend', 'Backend', 'Infrastructure', 'Mobile', 'Security', 'Data'];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const BugFilters = ({ filters, onChange, resultCount }) => {
  const hasFilters = filters.status !== 'all' || filters.priority !== 'all' ||
    filters.team !== 'all' || filters.search !== '';

  return (
    <div className="bg-white border-b border-slate-100 px-6 py-3">
      <div className="flex items-center gap-3 flex-wrap">

        {/* Smart search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder='Try "checkout crash" or "BUG-001"'
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
          />
          {filters.search && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
              semantic
            </span>
          )}
        </div>

        {/* Dropdowns */}
        {[
          ['status', STATUSES, 'All statuses'],
          ['priority', PRIORITIES, 'All priorities'],
          ['team', TEAMS, 'All teams'],
        ].map(([key, opts, placeholder]) => (
          <select key={key} value={filters[key]} onChange={e => onChange({ [key]: e.target.value })}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer">
            {opts.map(o => <option key={o} value={o}>{o === 'all' ? placeholder : cap(o)}</option>)}
          </select>
        ))}

        {/* Clear */}
        {hasFilters && (
          <button onClick={() => onChange({ status: 'all', priority: 'all', team: 'all', search: '' })}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}

        <span className="ml-auto text-xs text-slate-400">{resultCount} results</span>
      </div>
    </div>
  );
};
