import { useState } from 'react';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { ConfidenceBar } from '../ui/Primitives';

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('') : '?';
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const BugTableRow = ({ bug, onClick, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  // Real API uses _id, display uses bugId virtual or id (mock fallback)
  const displayId = bug.bugId || bug.id;

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // prevent row click / navigation
    setConfirmDelete(true);
  };

  const handleConfirm = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await onDelete(bug._id || bug.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  return (
    <tr onClick={onClick} className="hover:bg-slate-50 cursor-pointer group transition-colors">

      <td className="px-4 py-3">
        <span className="font-mono text-xs font-medium text-slate-400 group-hover:text-indigo-600 transition-colors">
          {displayId}
        </span>
      </td>

      <td className="px-4 py-3">
        <p className="font-medium text-slate-900 truncate max-w-xs group-hover:text-indigo-700 transition-colors">
          {bug.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{bug.component}</span>
          <span className="text-slate-200">·</span>
          <span className="text-xs text-slate-400">{bug.team}</span>
          {bug.aiOverridden && (
            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
              AI overridden
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <PriorityBadge priority={bug.priority} />
      </td>

      <td className="px-4 py-3">
        <StatusBadge status={bug.status} />
      </td>

      <td className="px-4 py-3">
        {bug.assignee ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {getInitials(bug.assignee)}
            </div>
            <span className="text-xs text-slate-700 truncate">{bug.assignee}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-300 italic">Unassigned</span>
        )}
      </td>

      <td className="px-4 py-3 pr-6">
        <ConfidenceBar score={bug.ai?.confidenceScore ?? 0} />
      </td>

      <td className="px-4 py-3">
        <span className="text-xs text-slate-400">{fmtDate(bug.createdAt)}</span>
      </td>

      {/* Delete column */}
      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
        {!confirmDelete ? (
          <button
            onClick={handleDeleteClick}
            title="Delete bug"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
          >
            <TrashIcon />
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleConfirm}
              disabled={deleting}
              className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {deleting ? '...' : 'Delete'}
            </button>
            <button
              onClick={handleCancel}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </td>

    </tr>
  );
};
