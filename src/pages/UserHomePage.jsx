import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../hooks/useBooking';
import { ownerService } from '../services/ownerService';
import {
  locationService,
  calculateHaversineDistanceKm,
} from '../services/locationService';
import ArenasHomeTab from '../components/dashboard/ArenasHomeTab';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import UserSidebar from '../components/layout/UserSidebar';

const PublicLobbiesTab = lazy(() => import('../components/dashboard/PublicLobbiesTab'));
const MyMatchesTab = lazy(() => import('../components/dashboard/MyMatchesTab'));
const FriendsTab = lazy(() => import('../components/dashboard/FriendsTab'));
const ProfileTab = lazy(() => import('../components/dashboard/ProfileTab'));
const ProSubscriptionTab = lazy(() => import('../components/dashboard/ProSubscriptionTab'));
const AccountSettingsTab = lazy(() => import('../components/dashboard/AccountSettingsTab'));
const ArenaDetailsPage = lazy(() => import('./ArenaDetailsPage'));
const MatchEvaluationPage = lazy(() => import('./MatchEvaluationPage'));
const BookingModal = lazy(() => import('../components/modals/BookingModal'));
const CreateMatchModal = lazy(() => import('../components/modals/CreateMatchModal'));
const LocationConsentModal = lazy(() => import('../components/modals/LocationConsentModal'));

function TabLoader() {
  return (
    <div className="py-16 flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-2 border-neon border-t-transparent animate-spin" />
    </div>
  );
}

export default function UserHomePage({
  pendingAction,
  clearPendingAction,
}) {
  const { user, isPro, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Arenas Filter State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxRadius, setMaxRadius] = useState(10);
  const [dbArenas, setDbArenas] = useState([]);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(
    () => user?.userLocation?.label ? user.userLocation : locationService.getStoredLocation()
  );
  const [locationConsentAccepted, setLocationConsentAccepted] = useState(
    () =>
      Boolean(
        user?.locationConsentAccepted || locationService.getStoredConsent()?.accepted
      )
  );
  const [selectedSlots, setSelectedSlots] = useState({
    1: '19:00',
    2: '19:30',
    3: '21:00',
    4: '20:00',
  });

  // Se o usuário ainda não aceitou o termo ou não definiu localização, exibe o modal de Termo + Localização
  useEffect(() => {
    const storedConsent = locationService.getStoredConsent();
    const storedLoc = locationService.getStoredLocation();
    if (!storedConsent?.accepted && !user?.locationConsentAccepted && !storedLoc?.label) {
      setLocationModalOpen(true);
    }
  }, [user]);

  const handleConfirmUserLocation = async (newLocation, consentAccepted) => {
    setUserLocation(newLocation);
    setLocationConsentAccepted(Boolean(consentAccepted));
    try {
      await updateUserProfile({
        locationConsentAccepted: Boolean(consentAccepted),
        userLocation: newLocation,
      });
    } catch {
      // Salvo localmente caso offline
    }
  };

  // Load MongoDB Arenas, Public Lobbies, and User Matches
  useEffect(() => {
    ownerService
      .getPublicArenas()
      .then((list) => {
        if (Array.isArray(list)) {
          setDbArenas(
            list.map((a) => ({
              ...a,
              id: a._id,
            }))
          );
        }
      })
      .catch(() => {});

    ownerService
      .getPublicLobbies()
      .then((list) => {
        if (Array.isArray(list)) {
          setPublicLobbies(list);
        }
      })
      .catch(() => {});

    ownerService
      .getMyMatches()
      .then((list) => {
        if (Array.isArray(list)) {
          setMyMatches(list);
          setRequestedLobbyIds(
            list
              .filter((m) => String(m.hostId) !== String(user?._id))
              .map((m) => String(m.id))
          );
        }
      })
      .catch(() => {});
  }, [user?._id]);

  const allArenas = useMemo(() => {
    // Recalcula a distância em km se o usuário forneceu localização (GPS ou Manual)
    return dbArenas
      .map((arena) => {
        if (
          userLocation?.lat &&
          userLocation?.lng &&
          arena.coordinates?.lat &&
          arena.coordinates?.lng
        ) {
          const distKm = calculateHaversineDistanceKm(
            userLocation.lat,
            userLocation.lng,
            arena.coordinates.lat,
            arena.coordinates.lng
          );
          if (distKm !== null) {
            return {
              ...arena,
              distanceKmValue: distKm,
              distance: `${distKm} km`,
            };
          }
        }
        return arena;
      })
      .sort((a, b) => (a.distanceKmValue ?? 99) - (b.distanceKmValue ?? 99));
  }, [dbArenas, userLocation]);

  // Lobbies & My Matches State (Iniciam vazios para novas contas, carregados do MongoDB)
  const [publicLobbies, setPublicLobbies] = useState([]);
  const [requestedLobbyIds, setRequestedLobbyIds] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [createMatchModalOpen, setCreateMatchModalOpen] = useState(false);

  // Booking Hook
  const {
    activeBookingArena,
    selectedProducts,
    splitWithFriends,
    bookingConfirmed,
    totalAmount,
    handleOpenBooking,
    handleCloseBooking,
    toggleProduct,
    toggleSplitWithFriends,
    confirmBooking,
    handleSelectSlot,
  } = useBooking(selectedSlots, setSelectedSlots, isPro);

  // Resume pending action if user just logged in from a protected button
  useEffect(() => {
    if (pendingAction) {
      if (pendingAction.type === 'create_match') {
        setCreateMatchModalOpen(true);
      } else if (pendingAction.type === 'book_arena' && pendingAction.arena) {
        handleOpenBooking(pendingAction.arena);
      }
      clearPendingAction();
    }
  }, [pendingAction, clearPendingAction]);

  // Filter Arenas
  const filteredArenas = useMemo(() => {
    return allArenas.filter((arena) => {
      const matchesSport = selectedCategory === 'all' || arena.sport === selectedCategory;
      const matchesQuery =
        arena.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        arena.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
        arena.sportLabel.toLowerCase().includes(searchQuery.toLowerCase());
      const numericDistance =
        arena.distanceKmValue !== undefined
          ? arena.distanceKmValue
          : parseFloat(String(arena.distance || '0').replace(',', '.')) || 0;
      const matchesRadius = !userLocation?.lat || numericDistance <= maxRadius;
      return matchesSport && matchesQuery && matchesRadius;
    });
  }, [allArenas, selectedCategory, searchQuery, userLocation, maxRadius]);

  // Handle Request Entry in Public Lobby
  const handleRequestJoinLobby = async (lobby) => {
    try {
      const res = await ownerService.toggleJoinLobby(lobby.id);
      if (res.joined) {
        setRequestedLobbyIds((prev) => [...prev, lobby.id]);
        setMyMatches((prev) => [res.match, ...prev.filter((m) => m.id !== res.match.id)]);
      } else {
        setRequestedLobbyIds((prev) => prev.filter((id) => id !== lobby.id));
        setMyMatches((prev) => prev.filter((m) => m.id !== lobby.id));
      }
      setPublicLobbies((prev) =>
        prev.map((l) => (l.id === lobby.id ? res.match : l))
      );
    } catch {
      // Fallback local
    }
  };

  // Handle Creating a New Match
  const handleCreateMatch = async (newLobby) => {
    try {
      const created = await ownerService.createMatch({
        ...newLobby,
        isPublicLobby: true,
        role: 'Organizador (Host)',
        status: 'Partida Publicada no Lobby',
      });
      setPublicLobbies((prev) => [created, ...prev]);
      setMyMatches((prev) => [created, ...prev]);
    } catch {
      setPublicLobbies((prev) => [newLobby, ...prev]);
      setMyMatches((prev) => [
        {
          id: `my_${newLobby.id}`,
          title: newLobby.title,
          arena: newLobby.arena,
          neighborhood: `Distância ${newLobby.distance}`,
          date: newLobby.time,
          role: 'Organizador (Host)',
          status: 'Partida Publicada no Lobby',
          playersCount: `${newLobby.filledSlots}/${newLobby.totalSlots}`,
          pricePerPlayer: newLobby.pricePerPlayer,
          extras: ['Lobby Público Ativo'],
        },
        ...prev,
      ]);
    }
    navigate('/app/minhas-partidas');
  };

  // Handle Confirming an Arena Booking and Adding to My Matches + MongoDB Owner Schedule
  const handleConfirmArenaBooking = async () => {
    confirmBooking();
    if (activeBookingArena) {
      const slot = selectedSlots[activeBookingArena.id] || '19:00';
      const chosenProducts = (activeBookingArena.products || []).filter((p) =>
        selectedProducts.includes(p.id)
      );
      const chosenProductNames = chosenProducts.map((p) => p.name);
      const productsSum = chosenProducts.reduce((acc, p) => acc + (p.price || 0), 0);

      // Persiste a reserva também no MongoDB caso a arena esteja registrada no banco
      if (activeBookingArena._id) {
        ownerService
          .createBooking({
            arenaId: activeBookingArena._id,
            courtName:
              activeBookingArena.selectedCourtName ||
              activeBookingArena.courts?.[0]?.name ||
              'Quadra Principal',
            surface:
              activeBookingArena.selectedSurface ||
              activeBookingArena.courts?.[0]?.surface ||
              'Grama Sintética',
            sport: activeBookingArena.sportLabel,
            dateLabel: activeBookingArena.selectedDate || 'Hoje',
            slotTime: slot,
            customerName: user?.name || 'Atleta Sport Maker',
            customerEmail: user?.email || '',
            isProCustomer: isPro,
            courtAmount: Math.max(0, totalAmount - productsSum),
            productsAmount: productsSum,
            productsList: chosenProductNames,
            paymentMethod: 'Pix',
            paymentStatus: 'paid',
            notes: splitWithFriends ? 'Reserva pelo App (Pix Split Ativado)' : 'Reserva pelo App',
          })
          .catch(() => { });
      }

      const matchPayload = {
        title: `Reserva Oficial • ${
          activeBookingArena.selectedCourtName ||
          activeBookingArena.sportLabel.split('•')[0]
        }`,
        arenaId: String(activeBookingArena._id || activeBookingArena.id || ''),
        arena: activeBookingArena.name,
        neighborhood: `${activeBookingArena.neighborhood}${
          activeBookingArena.selectedSurface
            ? ` • ${activeBookingArena.selectedSurface}`
            : ''
        }`,
        distance: activeBookingArena.distance || '1.5 km',
        time: `${activeBookingArena.selectedDate || 'Hoje'}, ${slot}`,
        role: 'Responsável pela Reserva',
        status: 'Confirmada',
        totalSlots: 14,
        filledSlots: 1,
        pricePerPlayer: activeBookingArena.pricePerPlayer,
        extras: chosenProductNames,
        isPublicLobby: false,
      };

      try {
        const savedMatch = await ownerService.createMatch(matchPayload);
        setMyMatches((prev) => [savedMatch, ...prev]);
      } catch {
        setMyMatches((prev) => [
          {
            id: `book_${Date.now()}`,
            ...matchPayload,
            date: matchPayload.time,
            playersCount: 'Convocação Aberta',
          },
          ...prev,
        ]);
      }
    }
  };

  const handleCancelMatch = async (matchId) => {
    await ownerService.cancelMatch(matchId).catch(() => {});
    setMyMatches((prev) => prev.filter((m) => m.id !== matchId));
    setPublicLobbies((prev) => prev.filter((l) => l.id !== matchId));
  };

  const handleEvaluationComplete = (matchId, evalSummary) => {
    setMyMatches((prev) =>
      prev.map((m) =>
        String(m.id) === String(matchId)
          ? {
              ...m,
              evaluated: true,
              evaluationStars: evalSummary.arenaStars,
            }
          : m
      )
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 relative pb-24 md:pb-12">
      {/* Left Sidebar Navigation for Desktop (md and up) */}
      <UserSidebar
        myMatchesCount={myMatches.length}
        user={user}
        onLogout={handleLogout}
      />

      {/* Mobile-Only Compact Top Header */}
      <header className="md:hidden sticky top-0 z-40 border-b border-white/10 bg-dark-950/90 backdrop-blur-xl">
        <div className="px-4 h-16 flex items-center justify-between">
          <NavLink to="/app/arenas" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neon flex items-center justify-center text-dark-950 font-display font-black text-lg shadow-neon">
              SM
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight text-white">
              SPORT<span className="text-neon">MAKER</span>
            </span>
          </NavLink>

          <div className="flex items-center gap-2">
            <NavLink to="/app/perfil">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover border border-neon cursor-pointer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-dark-900 border border-neon flex items-center justify-center text-[10px] font-display font-black text-neon cursor-pointer">
                  {(user?.name || 'AT')
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
              )}
            </NavLink>
            <button
              onClick={handleLogout}
              title="Sair da conta"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area shifted right on Desktop for Sidebar */}
      <main className="md:pl-64 lg:pl-72 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
          <Suspense fallback={<TabLoader />}>
            <Routes>
              <Route index element={<Navigate to="arenas" replace />} />
              <Route
                path="arenas"
                element={
                  <ArenasHomeTab
                    arenas={filteredArenas}
                    allArenas={allArenas}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    maxRadius={maxRadius}
                    onRadiusChange={setMaxRadius}
                    userLocation={userLocation}
                    onOpenLocationModal={() => setLocationModalOpen(true)}
                    onOpenArenaDetails={(arenaId) => {
                      navigate(`/app/arena/${arenaId}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                }
              />
              <Route
                path="arena/:arenaId"
                element={
                  <ArenaDetailsPage
                    arenas={allArenas}
                    selectedSlots={selectedSlots}
                    onSelectSlot={handleSelectSlot}
                    onScheduleMatch={handleOpenBooking}
                  />
                }
              />
              <Route
                path="lobbies"
                element={
                  <PublicLobbiesTab
                    lobbies={publicLobbies}
                    requestedLobbyIds={requestedLobbyIds}
                    onRequestJoinLobby={handleRequestJoinLobby}
                    onOpenCreateMatch={() => setCreateMatchModalOpen(true)}
                  />
                }
              />
              <Route
                path="minhas-partidas"
                element={
                  <MyMatchesTab
                    myMatches={myMatches}
                    onOpenCreateMatch={() => setCreateMatchModalOpen(true)}
                    onCancelMatch={handleCancelMatch}
                  />
                }
              />
              <Route
                path="avaliar/:matchId"
                element={
                  <MatchEvaluationPage
                    myMatches={myMatches}
                    onEvaluationComplete={handleEvaluationComplete}
                  />
                }
              />
              <Route path="amigos" element={<FriendsTab />} />
              <Route path="perfil" element={<ProfileTab />} />
              <Route path="seja-pro" element={<ProSubscriptionTab />} />
              <Route path="configuracoes" element={<AccountSettingsTab />} />
              <Route path="*" element={<Navigate to="arenas" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      {/* Bottom Tab Bar Exclusiva para Mobile */}
      <MobileBottomNav myMatchesCount={myMatches.length} />

      {/* Modals */}
      <Suspense fallback={null}>
        {activeBookingArena && (
          <BookingModal
            arena={activeBookingArena}
            selectedSlot={activeBookingArena ? selectedSlots[activeBookingArena.id] : null}
            selectedProducts={selectedProducts}
            splitWithFriends={splitWithFriends}
            bookingConfirmed={bookingConfirmed}
            totalAmount={totalAmount}
            isPro={isPro}
            onClose={handleCloseBooking}
            onToggleProduct={toggleProduct}
            onToggleSplit={toggleSplitWithFriends}
            onConfirm={handleConfirmArenaBooking}
          />
        )}

        {createMatchModalOpen && (
          <CreateMatchModal
            isOpen={createMatchModalOpen}
            onClose={() => setCreateMatchModalOpen(false)}
            onCreateMatch={handleCreateMatch}
            currentUser={user}
            arenas={allArenas}
          />
        )}

        {locationModalOpen && (
          <LocationConsentModal
            isOpen={locationModalOpen}
            onClose={() => setLocationModalOpen(false)}
            currentLocation={userLocation}
            initialConsentAccepted={locationConsentAccepted}
            onConfirmLocation={handleConfirmUserLocation}
          />
        )}
      </Suspense>
    </div>
  );
}
