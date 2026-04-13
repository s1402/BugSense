const PRIORITY_STYLES = {
  critical: 'bg-red-50 text-red-700 border border-red-200',
  high:     'bg-orange-50 text-orange-700 border border-orange-200',
  medium:   'bg-amber-50 text-amber-700 border border-amber-200',
  low:      'bg-slate-50 text-slate-600 border border-slate-200',
};

const PRIORITY_DOTS = {
  critical: 'bg-red-500 animate-pulse',
  high:     'bg-orange-500',
  medium:   'bg-amber-400',
  low:      'bg-slate-400',
};

const STATUS_STYLES = {
  open:          'bg-blue-50 text-blue-700 border border-blue-200',
  'in-progress': 'bg-violet-50 text-violet-700 border border-violet-200',
  resolved:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  closed:        'bg-slate-50 text-slate-500 border border-slate-200',
};

const STATUS_LABELS = {
  open: 'Open',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const PriorityBadge = ({ priority }) => (
  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.low}`}>
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOTS[priority] || PRIORITY_DOTS.low}`} />
    {priority}
  </span>
);

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.open}`}>
    {STATUS_LABELS[status] || status}
  </span>
);
