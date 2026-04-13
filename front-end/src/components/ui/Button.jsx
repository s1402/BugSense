const Spinner = ({ size = 'xs' }) => {
  const sz = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5' };
  return <div className={`${sz[size]} border-2 border-white/30 border-t-white rounded-full animate-spin`} />;
};

const VARIANTS = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm',
  ghost:     'text-slate-600 hover:bg-slate-100',
  danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
};

const SIZES = {
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export const Button = ({
  children, onClick, type = 'button',
  variant = 'primary', size = 'md',
  disabled, loading, className = '', icon,
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center gap-2 font-medium rounded-lg cursor-pointer
      transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1
      disabled:opacity-50 disabled:cursor-not-allowed
      ${VARIANTS[variant]} ${SIZES[size]} ${className}
    `}
  >
    {loading ? <Spinner /> : icon}
    {children}
  </button>
);
