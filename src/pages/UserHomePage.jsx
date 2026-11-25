import React, { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Search, Bell, MapPin, Navigation, X, Menu, ArrowLeft, LogOut, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../hooks/useBooking';
import { ownerService } from '../services/ownerService';
import {
  locationService,
  calculateHaversineDistanceKm,
} from '../services/locationService';
import ArenasHomeTab from '../components/dashboard/ArenasHomeTab';
import { getMatchViewKey } from '../components/dashboard/MyMatchesTab';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import UserSidebar from '../components/layout/UserSidebar';
import { TabPageSkeleton } from '../components/ui/SkeletonLoaders';

const PublicLobbiesTab = lazy(() => import('../components/dashboard/PublicLobbiesTab'));
const MyMatchesTab = lazy(() => import('../components/dashboard/MyMatchesTab'));
const NotificationsTab = lazy(() => import('../components/dashboard/NotificationsTab'));
const FriendsTab = lazy(() => import('../components/dashboard/FriendsTab'));
const ProfileTab = lazy(() => import('../components/dashboard/ProfileTab'));
const ProSubscriptionTab = lazy(() => import('../components/dashboard/ProSubscriptionTab'));
const TeamsTab = lazy(() => import('../components/dashboard/TeamsTab'));
const AccountSettingsTab = lazy(() => import('../components/dashboard/AccountSettingsTab'));
const ArenaDetailsPage = lazy(() => import('./ArenaDetailsPage'));
const MatchDetailsPage = lazy(() => import('./MatchDetailsPage'));
const MatchEvaluationPage = lazy(() => import('./MatchEvaluationPage'));
const BookingModal = lazy(() => import('../components/modals/BookingModal'));
const CreateMatchModal = lazy(() => import('../components/modals/CreateMatchModal'));
const LocationConsentModal = lazy(() => import('../components/modals/LocationConsentModal'));
const CancelMatchModal = lazy(() => import('../components/modals/CancelMatchModal'));

function TabLoader() {
  return <TabPageSkeleton />;
}

export default function UserHomePage({
  pendingAction,
  clearPendingAction,
}) {
  const { user, isPro, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isProfileRoute = location.pathname.startsWith('/app/perfil');
  const isMyMatchesRoute = location.pathname.startsWith('/app/minhas-partidas');
  const isLobbiesRoute = location.pathname.startsWith('/app/lobbies');

  // Arenas Filter State (Inicializa instantaneamente do cache do navegador)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxRadius, setMaxRadius] = useState(10);
  const [dbArenas, setDbArenas] = useState(() => ownerService.getCachedPublicArenas());
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSettingsDrawerOpen, setMobileSettingsDrawerOpen] = useState(false);
  const [mobileHeaderVisible, setMobileHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    setMobileSettingsDrawerOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Esconde a header mobile ao rolar para baixo e mostra ao rolar para cima
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY || 0;
      if (mobileSearchOpen || currentY <= 24) {
        setMobileHeaderVisible(true);
        lastScrollYRef.current = currentY;
        return;
      }

      const delta = currentY - lastScrollYRef.current;
      if (delta > 8) {
        setMobileHeaderVisible(false);
        lastScrollYRef.current = currentY;
      } else if (delta < -8) {
        setMobileHeaderVisible(true);
        lastScrollYRef.current = currentY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileSearchOpen]);
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

    ownerService
      .getNotifications()
      .then((res) => {
        if (res && Array.isArray(res.notifications)) {
          setNotifications(res.notifications);
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

  // Lobbies & My Matches State (Iniciam instantaneamente do cache local do navegador se disponível)
  const [publicLobbies, setPublicLobbies] = useState(() =>
    ownerService.getCachedPublicLobbies()
  );
  const [myMatches, setMyMatches] = useState(() => ownerService.getCachedMyMatches());
  const viewedStorageKey = `sportmaker_viewed_matches_${user?._id || 'guest'}`;
  const [viewedMatchKeys, setViewedMatchKeys] = useState(() => {
    try {
      const raw = localStorage.getItem(viewedStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(viewedStorageKey);
      setViewedMatchKeys(raw ? JSON.parse(raw) : {});
    } catch {
      setViewedMatchKeys({});
    }
  }, [viewedStorageKey]);

  const handleMarkMatchViewed = (matchKey) => {
    if (!matchKey) return;
    setViewedMatchKeys((prev) => {
      if (prev[matchKey]) return prev;
      const next = { ...prev, [matchKey]: true };
      try {
        localStorage.setItem(viewedStorageKey, JSON.stringify(next));
      } catch {
        // ignora erro de storage
      }
      return next;
    });
  };

  const unreadMatchesCount = useMemo(
    () => (myMatches || []).filter((m) => !viewedMatchKeys[getMatchViewKey(m)]).length,
    [myMatches, viewedMatchKeys]
  );

  const [notifications, setNotifications] = useState([]);
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleMarkNotificationRead = async (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (String(n.id || n._id) === String(notifId) ? { ...n, read: true } : n))
    );
    await ownerService.markNotificationRead(notifId).catch(() => {});
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await ownerService.markAllNotificationsRead().catch(() => {});
  };
  const [requestedLobbyIds, setRequestedLobbyIds] = useState(() =>
    ownerService
      .getCachedMyMatches()
      .filter((m) => String(m.hostId) !== String(user?._id))
      .map((m) => String(m.id))
  );
  const [createMatchModalOpen, setCreateMatchModalOpen] = useState(false);
  const [matchToCancel, setMatchToCancel] = useState(null);
  const [cancellingMatch, setCancellingMatch] = useState(false);
  const [cancelMatchError, setCancelMatchError] = useState('');
  const [redirectAfterCancel, setRedirectAfterCancel] = useState(false);

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

  // Helper: normaliza texto para comparação de cidade/região (sem acentos)
  const normalizeRegionText = (val) =>
    String(val || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const matchesUserCityOrRegion = (item) => {
    if (!userLocation?.label && !userLocation?.city && !userLocation?.lat) {
      return true;
    }
    const myCity = normalizeRegionText(
      userLocation.city || (userLocation.label ? userLocation.label.split(/[,-]/)[0] : '')
    );
    const itemRegion = normalizeRegionText(
      `${item.neighborhood || ''} ${item.address || ''} ${item.arena || ''}`
    );
    if (myCity && itemRegion.includes(myCity)) {
      return true;
    }
    // Fallback por proximidade ampla da região metropolitana (até 50 km)
    if (userLocation?.lat && item.distanceKmValue !== undefined) {
      return item.distanceKmValue <= 50;
    }
    return !myCity;
  };

  // Filter Arenas (toda a cidade ou região selecionada, sem filtro de raio fixo)
  const filteredArenas = useMemo(() => {
    return allArenas.filter((arena) => {
      const matchesSport = selectedCategory === 'all' || arena.sport === selectedCategory;
      const matchesQuery =
        arena.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        arena.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
        arena.sportLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSport && matchesQuery && matchesUserCityOrRegion(arena);
    });
  }, [allArenas, selectedCategory, searchQuery, userLocation]);

  // Filter Public Lobbies by User City/Region
  const filteredLobbies = useMemo(() => {
    return publicLobbies
      .map((lobby) => {
        const linkedArena = allArenas.find(
          (a) =>
            (lobby.arenaId &&
              (String(a._id) === String(lobby.arenaId) ||
                String(a.id) === String(lobby.arenaId))) ||
            (lobby.arena &&
              a.name &&
              lobby.arena.toLowerCase().includes(a.name.toLowerCase()))
        );
        if (linkedArena && linkedArena.distanceKmValue !== undefined) {
          return {
            ...lobby,
            neighborhood: linkedArena.neighborhood || lobby.neighborhood,
            address: linkedArena.address || '',
            distanceKmValue: linkedArena.distanceKmValue,
            distance: `${linkedArena.distanceKmValue} km`,
          };
        }
        return lobby;
      })
      .filter((lobby) => matchesUserCityOrRegion(lobby))
      .sort((a, b) => (a.distanceKmValue ?? 99) - (b.distanceKmValue ?? 99));
  }, [publicLobbies, allArenas, userLocation]);

  // Handle Request Entry in Public Lobby
  const handleRequestJoinLobby = async (lobby) => {
    try {
      const res = await ownerService.toggleJoinLobby(lobby.id);
      if (res.joined) {
        setRequestedLobbyIds((prev) =>
          prev.includes(lobby.id) ? prev : [...prev, lobby.id]
        );
        // Só entra em "Minhas Partidas" depois que o criador da partida aceitar o pedido
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
  const handleConfirmArenaBooking = async (chosenMaxPlayers) => {
    if (!activeBookingArena) return;
    const resolvedTotalSlots =
      Number(chosenMaxPlayers) ||
      Number(activeBookingArena.maxPlayers) ||
      Number(activeBookingArena.totalSlots) ||
      14;
    const resolvedPricePerPlayer = Math.max(
      1,
      Math.ceil((totalAmount || activeBookingArena.pricePerHour || 200) / resolvedTotalSlots)
    );
    const slot =
      activeBookingArena.selectedSlotTime ||
      selectedSlots[activeBookingArena.id] ||
      '19:00';
    const dateLabel = activeBookingArena.selectedDate || 'Hoje';
    const courtId =
      activeBookingArena.selectedCourtId ||
      activeBookingArena.courts?.[0]?.id ||
      'c1';
    const courtName =
      activeBookingArena.selectedCourtName ||
      activeBookingArena.courts?.[0]?.name ||
      'Quadra Principal';
    const isPublicLobby =
      activeBookingArena.isPublicLobby !== undefined
        ? Boolean(activeBookingArena.isPublicLobby)
        : false;

    const chosenProducts = (activeBookingArena.products || []).filter((p) =>
      selectedProducts.includes(p.id)
    );
    const chosenProductNames = chosenProducts.map((p) => p.name);
    const productsSum = chosenProducts.reduce((acc, p) => acc + (p.price || 0), 0);

    // Persiste a reserva também no MongoDB caso a arena esteja registrada no banco (com checagem anti-duplicidade)
    let createdBookingId = '';
    if (activeBookingArena._id) {
      try {
        const bookingRes = await ownerService.createBooking({
          arenaId: activeBookingArena._id,
          courtId,
          courtName,
          surface:
            activeBookingArena.selectedSurface ||
            activeBookingArena.courts?.[0]?.surface ||
            'Grama Sintética',
          sport: activeBookingArena.sportLabel,
          dateLabel,
          slotTime: slot,
          customerName: user?.name || 'Atleta Sport Maker',
          customerEmail: user?.email || '',
          isProCustomer: isPro,
          courtAmount: Math.max(0, totalAmount - productsSum),
          productsAmount: productsSum,
          productsList: chosenProductNames,
          paymentMethod: 'Pix',
          paymentStatus: 'paid',
          notes: `${isPublicLobby ? 'Partida Pública (Lobby)' : 'Somente Amigos'}${
            splitWithFriends ? ' • Pix Split Ativado' : ''
          }`,
        });
        createdBookingId = String(bookingRes?.booking?._id || '');
      } catch (err) {
        alert(
          err.message ||
            'Este horário acabou de ser reservado. Escolha outro horário livre.'
        );
        return;
      }
    }

    confirmBooking();

    // Atualiza imediatamente a lista local de horários ocupados da arena para bloquear duplicidade na UI
    setDbArenas((prev) =>
      prev.map((a) => {
        if (String(a._id || a.id) !== String(activeBookingArena._id || activeBookingArena.id)) {
          return a;
        }
        return {
          ...a,
          bookedSlots: [
            ...(a.bookedSlots || []),
            { courtId, courtName, dateLabel, slotTime: slot },
          ],
        };
      })
    );

    const matchPayload = {
      title: `${isPublicLobby ? 'Partida Aberta' : 'Partida Somente Amigos'} • ${
        courtName || activeBookingArena.sportLabel.split('•')[0]
      }`,
      bookingId: createdBookingId,
      arenaId: String(activeBookingArena._id || activeBookingArena.id || ''),
      arena: `${activeBookingArena.name} • ${courtName}`,
      neighborhood: `${activeBookingArena.neighborhood}${
        activeBookingArena.selectedSurface
          ? ` • ${activeBookingArena.selectedSurface}`
          : ''
      }`,
      distance: activeBookingArena.distance || '1.5 km',
      time: `${dateLabel}, ${slot}`,
      role: 'Organizador (Host)',
      status: isPublicLobby
        ? 'Confirmada • Lobby Público Ativo'
        : 'Confirmada • Somente Amigos',
      totalSlots: resolvedTotalSlots,
      filledSlots: 1,
      pricePerPlayer: resolvedPricePerPlayer,
      neededPositions: ['Qualquer Posição'],
      extras: [
        isPublicLobby ? '🌐 Partida Pública' : '🔒 Somente Amigos',
        ...(splitWithFriends ? ['💳 Divisão de Valor (Gateway)'] : []),
        ...chosenProductNames,
      ],
      isPublicLobby,
      splitWithFriends: Boolean(splitWithFriends),
    };

    try {
      const savedMatch = await ownerService.createMatch(matchPayload);
      setMyMatches((prev) => [savedMatch, ...prev]);
      if (isPublicLobby) {
        setPublicLobbies((prev) => [savedMatch, ...prev]);
      }
    } catch {
      setMyMatches((prev) => [
        {
          id: `book_${Date.now()}`,
          ...matchPayload,
          date: matchPayload.time,
          playersCount: `1/${resolvedTotalSlots}`,
        },
        ...prev,
      ]);
    }
  };

  const handleRequestCancelMatch = (matchId, { redirectToMatches = false } = {}) => {
    const target = myMatches.find((m) => String(m.id) === String(matchId));
    if (!target) return false;
    setCancelMatchError('');
    setRedirectAfterCancel(Boolean(redirectToMatches));
    setMatchToCancel(target);
    return false;
  };

  const handleConfirmCancelMatch = async () => {
    if (!matchToCancel) return;
    const matchId = matchToCancel.id;
    setCancellingMatch(true);
    setCancelMatchError('');
    try {
      const res = await ownerService.cancelMatch(matchId);
      if (res?.left) {
        setMyMatches((prev) => prev.filter((m) => String(m.id) !== String(matchId)));
        setRequestedLobbyIds((prev) => prev.filter((id) => String(id) !== String(matchId)));
      } else if (res?.match) {
        setMyMatches((prev) =>
          prev.map((m) => (String(m.id) === String(matchId) ? res.match : m))
        );
      } else {
        setMyMatches((prev) =>
          prev.map((m) =>
            String(m.id) === String(matchId)
              ? { ...m, status: 'Cancelada pelo Organizador', isPublicLobby: false }
              : m
          )
        );
      }
      setPublicLobbies((prev) => prev.filter((l) => String(l.id) !== String(matchId)));
      // Recarrega as arenas sem cache para que o horário cancelado fique imediatamente livre na UI
      ownerService
        .getPublicArenas({ forceRefresh: true })
        .then((list) => {
          if (Array.isArray(list)) {
            setDbArenas(list.map((a) => ({ ...a, id: a._id })));
          }
        })
        .catch(() => {});

      const shouldRedirect = redirectAfterCancel;
      setMatchToCancel(null);
      setRedirectAfterCancel(false);
      if (shouldRedirect) {
        navigate('/app/minhas-partidas');
      }
    } catch (err) {
      setCancelMatchError(err.message || 'Não foi possível cancelar esta partida.');
    } finally {
      setCancellingMatch(false);
    }
  };

  const handleMatchUpdated = useCallback(
    (updatedMatch) => {
      if (!updatedMatch || !updatedMatch.id) return;
      const uid = user?._id ? String(user._id) : '';
      const isUserInMatch =
        uid &&
        (String(updatedMatch.hostId) === uid ||
          (Array.isArray(updatedMatch.participants) &&
            updatedMatch.participants.some((p) => String(p.userId) === uid)));

      setMyMatches((prev) => {
        const exists = prev.some((m) => String(m.id) === String(updatedMatch.id));
        if (exists) {
          return prev.map((m) =>
            String(m.id) === String(updatedMatch.id) ? updatedMatch : m
          );
        }
        return isUserInMatch ? [updatedMatch, ...prev] : prev;
      });
      setPublicLobbies((prev) =>
        prev.map((l) => (String(l.id) === String(updatedMatch.id) ? updatedMatch : l))
      );
    },
    [user?._id]
  );

  const handleEvaluationComplete = (matchId, evalSummary) => {
    setMyMatches((prev) =>
      prev.map((m) =>
        String(m.id) === String(matchId)
          ? {
              ...m,
              evaluated: true,
              evaluationStars: evalSummary.arenaStars,
              evaluationSummary: {
                arenaStars: evalSummary.arenaStars,
                arenaTierLabel: evalSummary.arenaTierLabel,
                arenaComment: evalSummary.arenaComment || '',
                mvpPlayerId: evalSummary.mvpPlayerId || '',
                mvpPlayerName: evalSummary.mvpPlayerName || '',
                mvpPlayerAvatar: evalSummary.mvpPlayerAvatar || '',
                mvpScore: evalSummary.mvpScore ?? 9.5,
                playerRatings: evalSummary.playerRatings || [],
              },
            }
          : m
      )
    );

    if (evalSummary?.updatedArena) {
      const ua = evalSummary.updatedArena;
      setDbArenas((prev) =>
        prev.map((a) =>
          String(a._id) === String(ua._id) || a.name === ua.name
            ? {
                ...a,
                rating: ua.rating,
                reviewsCount: ua.reviewsCount,
                reviews: ua.reviews || a.reviews,
              }
            : a
        )
      );
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 relative pb-24 md:pb-12">
      {/* Left Sidebar Navigation for Desktop (md and up) */}
      <UserSidebar
        myMatchesCount={unreadMatchesCount}
        unreadNotificationsCount={unreadNotificationsCount}
        user={user}
        onLogout={handleLogout}
      />

      {/* Mobile-Only Compact Top Header */}
      <header
        className={`md:hidden sticky top-0 z-40 border-b border-white/10 bg-dark-950/90 backdrop-blur-xl transition-transform duration-300 ease-out ${
          mobileHeaderVisible || mobileSearchOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="px-4 h-16 grid grid-cols-3 items-center">
          {/* Esquerda: Sinal de + em Minhas Partidas e Lobbies, Lupa nas demais abas (ocultada em Meu Perfil) */}
          <div className="flex items-center justify-start">
            {isMyMatchesRoute || isLobbiesRoute ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => navigate('/app/arenas')}
                aria-label="Agendar ou criar partida"
                className="p-2.5 rounded-xl border bg-white/5 text-slate-200 border-white/10 hover:text-neon transition-colors"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            ) : !isProfileRoute ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => setMobileSearchOpen((prev) => !prev)}
                aria-label="Buscar arena ou localização"
                className={`p-2.5 rounded-xl border transition-colors ${
                  mobileSearchOpen
                    ? 'bg-neon text-dark-950 border-neon shadow-neon'
                    : 'bg-white/5 text-slate-200 border-white/10 hover:text-neon'
                }`}
              >
                {mobileSearchOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </motion.button>
            ) : null}
          </div>

          {/* Centro: Logo Sport Maker */}
          <div className="flex items-center justify-center">
            <NavLink to="/app/arenas" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-neon flex items-center justify-center text-dark-950 font-display font-black text-base shadow-neon">
                SM
              </div>
              <span className="font-display font-extrabold text-base tracking-tight text-white">
                SPORT<span className="text-neon">MAKER</span>
              </span>
            </NavLink>
          </div>

          {/* Direita: Menu de Configurações no Perfil, ou Notificações nas demais telas */}
          <div className="flex items-center justify-end">
            {isProfileRoute ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => setMobileSettingsDrawerOpen(true)}
                aria-label="Abrir configurações da conta"
                className="p-2.5 rounded-xl border bg-white/5 border-white/10 text-slate-200 hover:text-neon transition-colors"
              >
                <Menu className="w-5 h-5" />
              </motion.button>
            ) : (
              <NavLink
                to="/app/notificacoes"
                aria-label="Notificações"
                className={({ isActive }) =>
                  `relative p-2.5 rounded-xl border transition-colors ${
                    isActive
                      ? 'bg-neon/15 border-neon/40 text-neon'
                      : 'bg-white/5 border-white/10 text-slate-200 hover:text-neon'
                  }`
                }
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon text-dark-950 text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(204,255,0,0.5)]">
                    {unreadNotificationsCount}
                  </span>
                )}
              </NavLink>
            )}
          </div>
        </div>

        {/* Aba deslizante de Busca de Arena e Localização no Mobile */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden border-t border-white/10 bg-dark-950/95"
            >
              <div className="px-4 py-4 space-y-3">
                <div className="flex items-center gap-2.5 bg-dark-900 border border-white/15 rounded-2xl px-3.5 py-2.5 focus-within:border-neon">
                  <Search className="w-4 h-4 text-neon shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      navigate('/app/arenas');
                    }}
                    placeholder="Pesquisar pelo nome da arena, bairro ou esporte..."
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setLocationModalOpen(true);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                    userLocation?.label
                      ? 'bg-emerald-500/10 border-emerald-400/35 text-emerald-300'
                      : 'bg-amber-400/10 border-amber-400/35 text-amber-300'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Navigation className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {userLocation?.label
                        ? `Localização: ${userLocation.label}`
                        : 'Selecionar Localização ou Ativar GPS'}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-extrabold text-neon flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Alterar
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                    lobbies={filteredLobbies}
                    requestedLobbyIds={requestedLobbyIds}
                    onRequestJoinLobby={handleRequestJoinLobby}
                    onOpenCreateMatch={() => setCreateMatchModalOpen(true)}
                    maxRadius={maxRadius}
                    onRadiusChange={setMaxRadius}
                    userLocation={userLocation}
                    onOpenLocationModal={() => setLocationModalOpen(true)}
                  />
                }
              />
              <Route
                path="minhas-partidas"
                element={
                  <MyMatchesTab
                    myMatches={myMatches}
                    onOpenCreateMatch={() => setCreateMatchModalOpen(true)}
                    onCancelMatch={(id) => handleRequestCancelMatch(id)}
                    viewedMatchKeys={viewedMatchKeys}
                    onMarkMatchViewed={handleMarkMatchViewed}
                  />
                }
              />
              <Route
                path="partida/:matchId"
                element={
                  <MatchDetailsPage
                    myMatches={myMatches}
                    arenas={allArenas}
                    onMatchUpdated={handleMatchUpdated}
                    onCancelMatch={(id) =>
                      handleRequestCancelMatch(id, { redirectToMatches: true })
                    }
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
              <Route
                path="notificacoes"
                element={
                  <NotificationsTab
                    notifications={notifications}
                    onMarkRead={handleMarkNotificationRead}
                    onMarkAllRead={handleMarkAllNotificationsRead}
                  />
                }
              />
              <Route path="times" element={<TeamsTab />} />
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
      <MobileBottomNav
        myMatchesCount={unreadMatchesCount}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Mobile Full-Screen Slide-In (Fade para Esquerda até o final): Configurações da Conta */}
      <AnimatePresence>
        {mobileSettingsDrawerOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden fixed inset-0 z-50 bg-dark-950 overflow-y-auto"
          >
            <div className="sticky top-0 z-10 h-16 px-4 border-b border-white/10 bg-dark-950/95 backdrop-blur-xl flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMobileSettingsDrawerOpen(false)}
                className="flex items-center gap-2 text-sm font-display font-bold text-white hover:text-neon transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-neon" />
                <span>Configurações da Conta</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>

            <div className="px-4 py-6 pb-12">
              <Suspense fallback={<TabLoader />}>
                <AccountSettingsTab />
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

        <LocationConsentModal
          isOpen={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          currentLocation={userLocation}
          initialConsentAccepted={locationConsentAccepted}
          onConfirmLocation={handleConfirmUserLocation}
        />

        {matchToCancel && (
          <CancelMatchModal
            match={matchToCancel}
            isHost={
              Boolean(user?._id && String(matchToCancel.hostId) === String(user._id)) ||
              String(matchToCancel.role || '').toLowerCase().includes('organizador')
            }
            loading={cancellingMatch}
            errorMsg={cancelMatchError}
            onClose={() => {
              if (!cancellingMatch) {
                setMatchToCancel(null);
                setCancelMatchError('');
              }
            }}
            onConfirm={handleConfirmCancelMatch}
          />
        )}
      </Suspense>
    </div>
  );
}
