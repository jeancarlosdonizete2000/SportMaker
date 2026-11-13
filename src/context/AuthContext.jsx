import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = authService.getStoredSession();
    if (session) {
      setUser(session.user);
      setToken(session.token);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const logout = () => {
    authService.clearSession();
    setUser(null);
    setToken(null);
  };

  const updateUserProfile = async (updates) => {
    const updated = await authService.updateProfile(updates, token);
    setUser((prev) => ({ ...(prev || {}), ...updated }));
    return updated;
  };

  const activateProSubscription = async ({ planId, paymentMethod, transactionCode }) => {
    const upgradedUser = await authService.confirmProSubscription(
      { planId, paymentMethod, transactionCode },
      token
    );
    setUser(upgradedUser);
    return upgradedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isOwner: user?.role === 'owner',
        isPlayer: user?.role === 'player',
        isPro: !!user?.isPro && user?.proStatus === 'active',
        login,
        register,
        logout,
        updateUserProfile,
        activateProSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}

