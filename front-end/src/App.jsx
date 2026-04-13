import { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './store/authStore.jsx';
import { bugsApi } from './api/bugs.api.js';
import { authApi } from './api/auth.api.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { ToastContainer } from './components/notifications/ToastContainer.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { CreateBugPage } from './pages/CreateBugPage.jsx';
import { BugDetailPage } from './pages/BugDetailPage.jsx';
import { Spinner } from './components/ui/Primitives.jsx';

const AppInner = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [bugs,    setBugs]    = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [page,    setPage]    = useState({ name: 'dashboard' });
  const [toasts,  setToasts]  = useState([]);

  const addToast = useCallback((event) => {
    setToasts(t => [...t, { ...event, id: event.id ?? Date.now() }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(t => t.filter(toast => toast.id !== id));
  }, []);

  // Load bugs from real API
  const loadBugs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bugsApi.getAll();
      setBugs(data.bugs || []);
    } catch (err) {
      addToast({ message: 'Failed to load bugs', variant: 'error', actor: 'System', id: Date.now() });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await authApi.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err.message);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadBugs();
      loadUsers();
    }
  }, [isAuthenticated]);

  // Real WebSocket — replaces fake timer
  useWebSocket(bugs, (event) => {
    addToast(event);
    // Refresh bugs list when AI analysis completes
    if ( ['bug:ai_analyzed','bug:deleted' , 'bug:updated'].includes(event.type)) loadBugs();
  }, isAuthenticated);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => {}} />;
  }

  if (loading && bugs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Loading BugSense...</p>
        </div>
      </div>
    );
  }

  const handleCreate = (newBug) => {
    setBugs(b => [newBug, ...b]);
    setPage({ name: 'bug', id: newBug._id });
    addToast({ message: `${newBug.bugId} created — AI analysis running...`, actor: 'BugSense AI', variant: 'info', id: Date.now() });
  };

  const handleBugUpdated = (updatedBug) => {
    setBugs(b => b.map(bug => bug._id === updatedBug._id ? updatedBug : bug));
  };

  const handleDeleteBug = async (id) => {
    try {
      await bugsApi.delete(id);
      setBugs(b => b.filter(bug => (bug._id || bug.id) !== id));
      addToast({ message: 'Bug deleted successfully', actor: 'System', variant: 'success', id: Date.now() });
    } catch (err) {
      addToast({ message: 'Failed to delete bug', actor: 'System', variant: 'error', id: Date.now() });
      throw err;
    }
  };

  const currentBug = page.name === 'bug' ? bugs.find(b => b._id === page.id) : null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar page={page} setPage={setPage} user={user} onLogout={logout} />
      <main className="flex-1 overflow-hidden flex flex-col">
        {page.name === 'dashboard' && (
          <DashboardPage
            bugs={bugs}
            onBugsChange={setBugs}
            onNavigateBug={(id) => setPage({ name: 'bug', id })}
            onNavigateCreate={() => setPage({ name: 'create' })}
            onDeleteBug={handleDeleteBug}
          />
        )}
        {page.name === 'create' && (
          <CreateBugPage
            bugs={bugs}
            onBack={() => setPage({ name: 'dashboard' })}
            onCreate={handleCreate}
            onViewBug={(id) => setPage({ name: 'bug', id })}
          />
        )}
        {page.name === 'bug' && (
          <BugDetailPage
            bug={currentBug}
            users={users}
            onBack={() => setPage({ name: 'dashboard' })}
            onBugUpdated={handleBugUpdated}
          />
        )}
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
