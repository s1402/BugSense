import { useState } from 'react';
import { useAuth } from '../store/authStore.jsx';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Primitives';
import { TEAMS } from '../data/mockBugs';

const STATS    = [{ value: '94%', label: 'AI accuracy' }, { value: '3.2x', label: 'Faster triage' }, { value: '68%', label: 'Fewer duplicates' }];
const FEATURES = ['Duplicate detection', 'Auto-prioritization', 'Smart assignment', 'AI insights'];
const ROLES    = ['Senior Engineer', 'Staff Engineer', 'Engineering Manager', 'QA Engineer', 'DevOps Engineer'];

export const LoginPage = ({ onLogin }) => {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState(null);

  // Login fields
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName,     setRegName]     = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm,  setRegConfirm]  = useState('');
  const [regRole,     setRegRole]     = useState('');
  const [regTeam,     setRegTeam]     = useState('');

  const handleLogin = async () => {
    setError(null);
    if (!email) { setError('Email is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    }
  };

  const handleRegister = async () => {
    setError(null);
    if (!regName.trim()) { setError('Name is required'); return; }
    if (!regEmail) { setError('Email is required'); return; }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (regPassword !== regConfirm) { setError('Passwords do not match'); return; }
    if (!regRole) { setError('Select your role'); return; }
    if (!regTeam) { setError('Select your team'); return; }
    try {
      const user = await register({
        name: regName.trim(),
        email: regEmail,
        password: regPassword,
        role: regRole,
        team: regTeam,
      });
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      mode === 'login' ? handleLogin() : handleRegister();
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Brand panel */}
      <div className="hidden lg:flex w-[440px] bg-indigo-600 flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500 rounded-full translate-x-1/2 translate-y-1/2 opacity-50" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">BugSense</span>
        </div>
        <div className="relative space-y-5">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">Triage smarter.<br />Ship faster.</h1>
            <p className="mt-3 text-indigo-200 text-sm leading-relaxed">AI-powered bug intelligence that detects duplicates, prioritizes automatically, and routes issues to the right engineer.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map(f => (
              <span key={f} className="inline-flex items-center gap-1.5 bg-white/10 text-indigo-100 text-xs font-medium px-3 py-1.5 rounded-full border border-white/20">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />{f}
              </span>
            ))}
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-3">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 border border-white/10">
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-indigo-300 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Tab switcher */}
          <div className="flex mb-8 border-b border-slate-200">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer
                ${mode === 'login' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              Sign In
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer
                ${mode === 'register' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              Create Account
            </button>
          </div>

          {mode === 'login' ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                <p className="mt-1 text-sm text-slate-500">Sign in to your workspace</p>
              </div>
              <div className="space-y-4">
                <Input label="Email address" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="you@company.com" />
                <Input label="Password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Enter password" />
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
                <p className="mt-1 text-sm text-slate-500">Join your team on BugSense</p>
              </div>
              <div className="space-y-4">
                <Input label="Full name" value={regName}
                  onChange={e => setRegName(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Jane Doe" />
                <Input label="Email address" type="email" value={regEmail}
                  onChange={e => setRegEmail(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="you@company.com" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Password" type="password" value={regPassword}
                    onChange={e => setRegPassword(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Min 6 characters" />
                  <Input label="Confirm password" type="password" value={regConfirm}
                    onChange={e => setRegConfirm(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Re-enter password" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Role" value={regRole} onChange={e => setRegRole(e.target.value)}>
                    <option value="">Select role...</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </Select>
                  <Select label="Team" value={regTeam} onChange={e => setRegTeam(e.target.value)}>
                    <option value="">Select team...</option>
                    {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button variant="primary" size="lg" className="w-full mt-5"
            onClick={mode === 'login' ? handleLogin : handleRegister} loading={loading}>
            {loading
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </Button>

          {/* Switch prompt */}
          <p className="text-center text-xs text-slate-500 mt-5">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => switchMode('register')}
                  className="text-indigo-600 font-semibold hover:underline cursor-pointer">Create one</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => switchMode('login')}
                  className="text-indigo-600 font-semibold hover:underline cursor-pointer">Sign in</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
