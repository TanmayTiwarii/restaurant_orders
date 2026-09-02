import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('corkless_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('corkless_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('corkless_user', JSON.stringify(res.data));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('corkless_token');
          localStorage.removeItem('corkless_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, token } = res.data;
    localStorage.setItem('corkless_token', token);
    localStorage.setItem('corkless_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async ({ name, email, password, role }) => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { user: userData, token } = res.data;
    localStorage.setItem('corkless_token', token);
    localStorage.setItem('corkless_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('corkless_token');
    localStorage.removeItem('corkless_user');
    setUser(null);
  };

  const isManager = user?.role === 'manager';
  const isWaiter = user?.role === 'waiter';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isManager,
        isWaiter,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
