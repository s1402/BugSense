import { PriorityBadge } from '../ui/Badge';
import { Spinner } from '../ui/Primitives';

const SimilarityBar = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = pct >= 60 ? 'bg-red-400' : pct >= 35 ? 'bg-amber-400' : 'bg-blue-400';
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-500 w-8">{pct}%</span>
    </div>
  );
};

export const DuplicateWarning = ({ similar, isChecking, onViewBug }) => {
  if (!isChecking && similar.length === 0) return null;

  return (
    <div className="mt-2 border border-amber-200 bg-amber-50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-200">
        {isChecking ? (
          <>
            <Spinner size="xs" />
            <span className="text-xs text-amber-700 font-medium">Checking for duplicates...</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-amber-700 font-semibold">
              {similar.length} possible duplicate{similar.length > 1 ? 's' : ''} detected
            </span>
            <span className="text-xs text-amber-500 ml-auto">powered by semantic search</span>
          </>
        )}
      </div>

      {/* Results */}
      {!isChecking && similar.length > 0 && (
        <div className="divide-y divide-amber-100">
          {similar.map(({ bug, similarity }) => (
            <div key={bug._id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="font-mono text-xs text-amber-700 font-semibold flex-shrink-0">{bug.bugId || bug.id}</span>
              <p className="text-xs text-slate-700 flex-1 truncate">{bug.title}</p>
              <PriorityBadge priority={bug.priority} />
              <SimilarityBar score={similarity} />
              <button onClick={() => onViewBug(bug._id)}
                className="text-xs text-indigo-600 hover:underline font-medium flex-shrink-0 cursor-pointer">
                View →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
