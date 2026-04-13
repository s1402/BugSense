export const Card = ({ children, className = '', onClick, hoverable }) => (
  <div
    onClick={onClick}
    className={`bg-white border border-slate-200 rounded-xl shadow-sm
      ${hoverable ? 'hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all duration-150' : ''}
      ${className}`}
  >
    {children}
  </div>
);

const ACCENT_BORDERS = {
  slate: 'border-t-slate-400', red: 'border-t-red-500',
  blue: 'border-t-blue-500', violet: 'border-t-violet-500', emerald: 'border-t-emerald-500',
};

export const StatCard = ({ label, value, sublabel, accent = 'slate' }) => (
  <Card className={`p-4 border-t-2 ${ACCENT_BORDERS[accent]}`}>
    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
    {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
  </Card>
);

export const ConfidenceBar = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-blue-500' : 'bg-amber-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-500 w-8 text-right">{pct}%</span>
    </div>
  );
};

export const Input = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input
      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
        ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

export const Textarea = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <textarea
      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none
        ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

export const Select = ({ label, error, children, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <select
      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
        ${error ? 'border-red-300' : 'border-slate-200'} ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

export const Spinner = ({ size = 'sm' }) => {
  const sz = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return <div className={`${sz[size]} border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin`} />;
};
