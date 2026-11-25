import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ARENAS_DATA } from '../data/mockData';
import { useBooking } from '../hooks/useBooking';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import HeroSection from '../components/sections/HeroSection';
import ArenaExplorerSection from '../components/sections/ArenaExplorerSection';
import {
  locationService,
  calculateHaversineDistanceKm,
} from '../services/locationService';
import { ownerService } from '../services/ownerService';

const PlayerProfileSection = lazy(() => import('../components/sections/PlayerProfileSection'));
const CommunitySection = lazy(() => import('../components/sections/CommunitySection'));
const EvaluationShowcaseSection = lazy(() => import('../components/sections/EvaluationShowcaseSection'));
const ArenaOwnersSection = lazy(() => import('../components/sections/ArenaOwnersSection'));
const BookingModal = lazy(() => import('../components/modals/BookingModal'));
const CreateMatchModal = lazy(() => import('../components/modals/CreateMatchModal'));
const LocationConsentModal = lazy(() => import('../components/modals/LocationConsentModal'));

const SHOWCASE_LANDING_LOBBIES = [
  {
    id: 'showcase_1',
    title: 'Society 7x7 Competitivo • Nível Intermediário/Avançado',
    arena: 'Arena Prime Sports & Lounge • Quadra 1 FIFA Pro',
    distance: '1.2 km',
    time: 'Hoje, 20:00',
    totalSlots: 14,
    filledSlots: 11,
    pricePerPlayer: 22,
    neededPositions: ['Goleiro', 'Zagueiro', 'Atacante'],
    host: {
      name: 'Rafael "R10" Oliveira',
      rating: 91,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
  },
  {
    id: 'showcase_2',
    title: 'Beach Tennis Duplas Mistas • Resenha & 3º Tempo',
    arena: 'Sunset Beach Club • Quadra Areia 3',
    distance: '2.1 km',
    time: 'Hoje, 19:30',
    totalSlots: 8,
    filledSlots: 6,
    pricePerPlayer: 30,
    neededPositions: ['Categoria B', 'Categoria C'],
    host: {
      name: 'Mariana Costa',
      rating: 89,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    },
  },
  {
    id: 'showcase_3',
    title: 'Futevôlei Altinha & Rachão • Pós-Expediente',
    arena: 'Vila Arena Beach • Quadra Principal',
    distance: '3.4 km',
    time: 'Amanhã, 18:30',
    totalSlots: 8,
    filledSlots: 5,
    pricePerPlayer: 25,
    neededPositions: ['Levantador', 'Atacante'],
    host: {
      name: 'Lucas "Paredão" Mendes',
      rating: 93,
      avatar: '/players/hero-player-16.jpg',
    },
  },
];

export default function HomePage({
  onRequireAuth,
  onNavigateLogin,
  pendingAction,
  clearPendingAction,
  onEnterUserHome,
}) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const redirectToLoginFromLanding = (reason) => {
    onRequireAuth({
      role: 'player',
      reason:
        reason ||
        'Faça login ou crie sua conta para agendar horários, entrar em lobbies e criar partidas.',
    });
  };

  const handleViewArenaDetails = (arena) => {
    if (!isAuthenticated) {
      redirectToLoginFromLanding(
        `Faça login para ver os horários e reservar na ${arena?.name || 'arena'}.`
      );
      return;
    }
    navigate(`/app/arena/${arena.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoLobbyClick = () => {
    if (!isAuthenticated) {
      redirectToLoginFromLanding('Faça login para acessar o Lobby de Partidas.');
      return;
    }
    navigate('/app/lobbies');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLandingSelectSlot = () => {
    if (!isAuthenticated) {
      redirectToLoginFromLanding(
        'Faça login para escolher um horário e confirmar sua reserva.'
      );
      return;
    }
    navigate('/app/arenas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Arena Explorer & Search Filters State (Inicializa instantaneamente com cache local da máquina do usuário)
  const [dbArenas, setDbArenas] = useState(() => ownerService.getCachedPublicArenas());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxRadius, setMaxRadius] = useState(5);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Assim que o usuário aceitar os termos (ou se já aceitou e ainda não tem localização), solicita GPS real automaticamente
  useEffect(() => {
    const requestRealLocation = async () => {
      try {
        locationService.saveConsent(true);
        const loc = await locationService.requestBrowserGpsLocation();
        if (loc) {
          locationService.saveLocation(loc);
          setUserLocation(loc);
        }
      } catch {
        // Usuário recusou ou GPS indisponível no navegador
      }
    };

    const handleTermsAccepted = () => {
      requestRealLocation();
    };

    window.addEventListener('sportmaker:terms-accepted', handleTermsAccepted);

    try {
      const termsSaved = JSON.parse(
        localStorage.getItem('sportmaker_terms_accepted_v1') || 'null'
      );
      if (termsSaved?.accepted && !locationService.getStoredLocation()?.lat) {
        requestRealLocation();
      }
    } catch {
      // ignora
    }

    return () => {
      window.removeEventListener('sportmaker:terms-accepted', handleTermsAccepted);
    };
  }, []);

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
  }, []);
  const [userLocation, setUserLocation] = useState(() =>
    locationService.getStoredLocation()
  );
  const [locationConsentAccepted, setLocationConsentAccepted] = useState(() =>
    Boolean(locationService.getStoredConsent()?.accepted)
  );
  const [selectedSlots, setSelectedSlots] = useState({
    1: '19:00',
    2: '19:30',
    3: '21:00',
    4: '20:00',
  });

  // Lobbies fictícios exclusivos para demonstração na Landing Page (não exibe partidas reais de usuários)
  const [lobbies, setLobbies] = useState(SHOWCASE_LANDING_LOBBIES);
  const [createMatchModalOpen, setCreateMatchModalOpen] = useState(false);

  // Booking Flow Custom Hook
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
  } = useBooking(selectedSlots, setSelectedSlots);

  // Resume pending action after successful login
  useEffect(() => {
    if (isAuthenticated && pendingAction) {
      if (pendingAction.type === 'create_match') {
        setCreateMatchModalOpen(true);
      } else if (pendingAction.type === 'book_arena' && pendingAction.arena) {
        handleOpenBooking(pendingAction.arena);
      }
      clearPendingAction();
    }
  }, [isAuthenticated, pendingAction, clearPendingAction]);

  // Protected handler: only authenticated users can create a match or book an arena
  const handleProtectedCreateMatch = () => {
    if (!isAuthenticated) {
      onRequireAuth({
        role: 'player',
        reason: 'Faça login na sua conta para criar uma nova partida aberta na sua região.',
        action: { type: 'create_match' },
      });
      return;
    }
    setCreateMatchModalOpen(true);
  };

  const handleProtectedBooking = (arena) => {
    if (!isAuthenticated) {
      onRequireAuth({
        role: 'player',
        reason: `Faça login para reservar o horário na ${arena.name} e adicionar produtos ao seu jogo.`,
        action: { type: 'book_arena', arena },
      });
      return;
    }
    handleOpenBooking(arena);
  };

  const handleAddCreatedMatch = async (newLobby) => {
    try {
      const saved = await ownerService.createMatch(newLobby);
      setLobbies((prev) => [saved, ...prev]);
    } catch {
      setLobbies((prev) => [newLobby, ...prev]);
    }
    const communityEl = document.getElementById('comunidade');
    if (communityEl) {
      communityEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filtered Arenas from MongoDB with dynamic distance calculation from User Location
  const filteredArenas = useMemo(() => {
    return dbArenas.map((arena) => {
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
      .filter((arena) => {
        const matchesSport = selectedCategory === 'all' || arena.sport === selectedCategory;
        const matchesQuery =
          arena.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          arena.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
          arena.sportLabel.toLowerCase().includes(searchQuery.toLowerCase());
        if (!userLocation?.label && !userLocation?.city && !userLocation?.lat) {
          return matchesSport && matchesQuery;
        }
        const norm = (val) =>
          String(val || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
        const myCity = norm(
          userLocation.city || (userLocation.label ? userLocation.label.split(/[,-]/)[0] : '')
        );
        const arenaRegion = norm(`${arena.neighborhood || ''} ${arena.address || ''}`);
        const matchesRegion =
          (myCity && arenaRegion.includes(myCity)) ||
          (userLocation?.lat && arena.distanceKmValue !== undefined && arena.distanceKmValue <= 50) ||
          !myCity;
        return matchesSport && matchesQuery && matchesRegion;
      })
      .sort((a, b) => (a.distanceKmValue ?? 9999) - (b.distanceKmValue ?? 9999));
  }, [dbArenas, selectedCategory, searchQuery, userLocation]);

  return (
    <MainLayout
      onQuickBook={() => handleProtectedBooking(ARENAS_DATA[0])}
      onNavigateLogin={onNavigateLogin}
      onCreateMatchClick={handleGoLobbyClick}
      onEnterUserHome={onEnterUserHome}
    >
      <HeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        maxRadius={maxRadius}
        onRadiusChange={setMaxRadius}
        selectedSlotForFeatured={selectedSlots[1]}
        onSelectSlotForFeatured={handleLandingSelectSlot}
        onOpenBooking={handleProtectedBooking}
        userLocation={userLocation}
        onOpenLocationModal={() => setLocationModalOpen(true)}
      />

      <ArenaExplorerSection
        arenas={filteredArenas}
        allArenas={dbArenas}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedSlots={selectedSlots}
        onSelectSlot={handleLandingSelectSlot}
        onOpenBooking={handleProtectedBooking}
        onViewArenaDetails={handleViewArenaDetails}
      />

      <Suspense fallback={null}>
        <PlayerProfileSection />

        <CommunitySection
          lobbies={lobbies}
          onCreateMatchClick={handleProtectedCreateMatch}
        />

        <EvaluationShowcaseSection />

        <ArenaOwnersSection
          onSimulateCheckout={handleProtectedBooking}
          onOwnerLogin={() => onNavigateLogin('owner')}
        />
      </Suspense>

      <Suspense fallback={null}>
        {activeBookingArena && (
          <BookingModal
            arena={activeBookingArena}
            selectedSlot={activeBookingArena ? selectedSlots[activeBookingArena.id] : null}
            selectedProducts={selectedProducts}
            splitWithFriends={splitWithFriends}
            bookingConfirmed={bookingConfirmed}
            totalAmount={totalAmount}
            onClose={handleCloseBooking}
            onToggleProduct={toggleProduct}
            onToggleSplit={toggleSplitWithFriends}
            onConfirm={confirmBooking}
          />
        )}

        {createMatchModalOpen && (
          <CreateMatchModal
            isOpen={createMatchModalOpen}
            onClose={() => setCreateMatchModalOpen(false)}
            onCreateMatch={handleAddCreatedMatch}
            currentUser={user}
            arenas={dbArenas}
          />
        )}

        {locationModalOpen && (
          <LocationConsentModal
            isOpen={locationModalOpen}
            onClose={() => setLocationModalOpen(false)}
            currentLocation={userLocation}
            initialConsentAccepted={locationConsentAccepted}
            onConfirmLocation={(newLoc, accepted) => {
              setUserLocation(newLoc);
              setLocationConsentAccepted(Boolean(accepted));
            }}
          />
        )}
      </Suspense>
    </MainLayout>
  );
}
