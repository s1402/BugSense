import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../src/store/authStore.jsx';

jest.mock('../../../src/api/auth.api.js', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    me: jest.fn(),
    getUsers: jest.fn(),
  },
}));

const { authApi } = require('../../../src/api/auth.api.js');

const Probe = () => {
  const { user, isAuthenticated, login, logout, error } = useAuth();
  return (
    <div>
      <div data-testid="auth-state">{isAuthenticated ? 'in' : 'out'}</div>
      <div data-testid="user-email">{user?.email || ''}</div>
      <div data-testid="error">{error || ''}</div>
      <button onClick={() => login('a@b.com', 'pw').catch(() => {})}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('starts unauthenticated when localStorage is empty', () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByTestId('auth-state').textContent).toBe('out');
  });

  it('hydrates user from localStorage on mount', () => {
    localStorage.setItem('bugsense_user', JSON.stringify({ email: 'cached@x.com' }));
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByTestId('user-email').textContent).toBe('cached@x.com');
  });

  it('persists token + user to localStorage on successful login', async () => {
    authApi.login.mockResolvedValue({ token: 'tok123', user: { email: 'a@b.com' } });
    render(<AuthProvider><Probe /></AuthProvider>);

    await act(async () => {
      screen.getByText('login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('in');
    });
    expect(localStorage.getItem('bugsense_token')).toBe('tok123');
    expect(JSON.parse(localStorage.getItem('bugsense_user'))).toEqual({ email: 'a@b.com' });
  });

  it('surfaces error when login fails', async () => {
    authApi.login.mockRejectedValue({ message: 'Invalid credentials' });
    render(<AuthProvider><Probe /></AuthProvider>);

    await act(async () => {
      screen.getByText('login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Invalid credentials');
    });
    expect(screen.getByTestId('auth-state').textContent).toBe('out');
  });

  it('clears token + user on logout', async () => {
    localStorage.setItem('bugsense_token', 'tok');
    localStorage.setItem('bugsense_user', JSON.stringify({ email: 'x@x.com' }));
    render(<AuthProvider><Probe /></AuthProvider>);

    await act(async () => {
      screen.getByText('logout').click();
    });

    expect(localStorage.getItem('bugsense_token')).toBeNull();
    expect(screen.getByTestId('auth-state').textContent).toBe('out');
  });
});
