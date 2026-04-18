import { useState, type ReactNode } from 'react';
import { authApi, type User } from '../lib/api';
import { AuthContext } from './useAuth';

function loadUser(): User | null {
  const stored = localStorage.getItem('user');
  const token = localStorage.getItem('access_token');
  if (!stored || !token) return null;
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);

  async function login(email: string, password: string) {
    const data = await authApi.login(email, password);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading: false, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
