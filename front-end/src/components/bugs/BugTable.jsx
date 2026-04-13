import { useState } from 'react';
import { BugTableRow } from './BugTableRow';

const SORT_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const SortIcon = ({ active, dir }) => (
  <svg className={`w-3 h-3 ml-1 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {dir === 'asc' && active
      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />}
  </svg>
);

const COLS = [
  { key: null,         label: 'ID',           width: 'w-24' },
  { key: null,         label: 'Title',         width: '' },
  { key: 'priority',   label: 'Priority',      width: 'w-28' },
  { key: null,         label: 'Status',        width: 'w-28' },
  { key: null,         label: 'Assignee',      width: 'w-36' },
  { key: 'confidence', label: 'AI Confidence', width: 'w-36' },
  { key: 'createdAt',  label: 'Created',       width: 'w-24' },
  { key: null,         label: '',              width: 'w-24' }, // delete action column
];

export const BugTable = ({ bugs, onRowClick, onDelete }) => {
  const [sortBy,  setSortBy]  = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (col) => {
    if (!col) return;
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const sorted = [...bugs].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'priority')   return dir * ((SORT_ORDER[a.priority] ?? 4) - (SORT_ORDER[b.priority] ?? 4));
    if (sortBy === 'confidence') return dir * ((a.ai?.confidenceScore ?? 0) - (b.ai?.confidenceScore ?? 0));
    if (sortBy === 'createdAt')  return dir * (new Date(a.createdAt) - new Date(b.createdAt));
    return 0;
  });

  if (bugs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-700">No bugs found</p>
        <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  // Use _id for real API bugs, id for mock data fallback
  const getBugKey  = (bug) => bug._id || bug.id;
  const getClickId = (bug) => bug._id || bug.id;

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <tr>
          {COLS.map(({ key, label, width }) => (
            <th key={label || 'actions'} className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${width}`}>
              {key ? (
                <button className="group flex items-center cursor-pointer" onClick={() => handleSort(key)}>
                  {label}
                  <SortIcon active={sortBy === key} dir={sortDir} />
                </button>
              ) : label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {sorted.map(bug => (
          <BugTableRow
            key={getBugKey(bug)}
            bug={bug}
            onClick={() => onRowClick(getClickId(bug))}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  );
};
