import React, { useState, useCallback, lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import MainLayout from './components/layout/MainLayout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const UserHomePage = lazy(() => import('./pages/UserHomePage'));
const OwnerHomePage = lazy(() => import('./pages/OwnerHomePage'));
const ArenaDetailsPage = lazy(() => import('./pages/ArenaDetailsPage'));
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage'));
const TermsOfServiceModal = lazy(() => import('./components/modals/TermsOfServiceModal'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-neon border-t-transparent animate-spin" />
    </div>
  );
}

function LoginRouteWrapper({ redirectReason, clearRedirectReason }) {
  const { roleParam } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const resolvedRole = roleParam === 'proprietario' || roleParam === 'owner' ? 'owner' : 'player';

  return (
    <LoginPage
      initialRole={resolvedRole}
      redirectReason={redirectReason}
      onSuccess={(loggedUser) => {
        clearRedirectReason();
        const targetRole = loggedUser?.role || user?.role || resolvedRole;
        navigate(targetRole === 'owner' ? '/proprietario/ganhos' : '/app/arenas');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      onBack={() => {
        clearRedirectReason();
        if (isAuthenticated) {
          navigate(user?.role === 'owner' ? '/proprietario/ganhos' : '/app/arenas');
        } else {
          navigate('/');
        }
      }}
    />
  );
}

function PublicArenaDetailsRoute({ onRequireAuth, onNavigateLogin }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedSlots, setSelectedSlots] = useState({
    1: '19:00',
    2: '19:30',
    3: '21:00',
    4: '20:00',
  });

  const handleSelectSlot = (arenaId, time) => {
    setSelectedSlots((prev) => ({ ...prev, [arenaId]: time }));
  };

  const handleScheduleMatch = (arenaWithSelection) => {
    if (!isAuthenticated) {
      onRequireAuth({
        role: 'player',
        reason: `Faça login para confirmar o agendamento na ${arenaWithSelection.name} (${arenaWithSelection.selectedCourtName}).`,
        action: { type: 'book_arena', arena: arenaWithSelection },
      });
      return;
    }
    navigate(`/app/arena/${arenaWithSelection.id}`);
  };

  return (
    <MainLayout
      onNavigateLogin={onNavigateLogin}
      onCreateMatchClick={() => navigate(isAuthenticated ? '/app/lobbies' : '/login/atleta')}
      onEnterUserHome={() => navigate('/app/arenas')}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <ArenaDetailsPage
          selectedSlots={selectedSlots}
          onSelectSlot={handleSelectSlot}
          onScheduleMatch={handleScheduleMatch}
        />
      </div>
    </MainLayout>
  );
}

function ProtectedAppRoute({ pendingAction, clearPendingAction }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'owner') {
    return <Navigate to="/proprietario/ganhos" replace />;
  }

  return (
    <UserHomePage
      pendingAction={pendingAction}
      clearPendingAction={clearPendingAction}
    />
  );
}

function ProtectedOwnerRoute() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login/proprietario" replace />;
  }

  if (user?.role && user.role !== 'owner') {
    return <Navigate to="/app/arenas" replace />;
  }

  return <OwnerHomePage />;
}

function AppRoutes() {
  const navigate = useNavigate();
  const [redirectReason, setRedirectReason] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const handleNavigateLogin = useCallback(
    (role = 'player') => {
      setRedirectReason('');
      navigate(role === 'owner' ? '/login/proprietario' : '/login/atleta');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate]
  );

  const handleRequireAuth = useCallback(
    ({ role = 'player', reason = '', action = null }) => {
      setRedirectReason(reason);
      setPendingAction(action);
      navigate(role === 'owner' ? '/login/proprietario' : '/login/atleta');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate]
  );

  const handleClearPendingAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  const handleClearRedirectReason = useCallback(() => {
    setRedirectReason('');
  }, []);

  return (
    <Routes>
      {/* Landing Page Institucional */}
      <Route
        path="/"
        element={
          <HomePage
            onRequireAuth={handleRequireAuth}
            onNavigateLogin={handleNavigateLogin}
            pendingAction={pendingAction}
            clearPendingAction={handleClearPendingAction}
            onEnterUserHome={() => navigate('/app/arenas')}
          />
        }
      />

      {/* Página Pública de Detalhes da Arena */}
      <Route
        path="/arena/:arenaId"
        element={
          <PublicArenaDetailsRoute
            onRequireAuth={handleRequireAuth}
            onNavigateLogin={handleNavigateLogin}
          />
        }
      />

      {/* Rotas de Autenticação (Atleta e Proprietário) */}
      <Route
        path="/login"
        element={
          <LoginRouteWrapper
            redirectReason={redirectReason}
            clearRedirectReason={handleClearRedirectReason}
          />
        }
      />
      <Route
        path="/login/:roleParam"
        element={
          <LoginRouteWrapper
            redirectReason={redirectReason}
            clearRedirectReason={handleClearRedirectReason}
          />
        }
      />

      {/* Rotas Protegidas da Home Pós-Login do Atleta */}
      <Route
        path="/app/*"
        element={
          <ProtectedAppRoute
            pendingAction={pendingAction}
            clearPendingAction={handleClearPendingAction}
          />
        }
      />

      {/* Rotas Protegidas da Home do Proprietário de Arena */}
      <Route path="/proprietario/*" element={<ProtectedOwnerRoute />} />

      {/* Perfil público do Jogador + PlayerCard */}
      <Route path="/jogador/:userId" element={<PlayerProfilePage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <TermsOfServiceModal />
        </Suspense>
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
