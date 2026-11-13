import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ARENAS_DATA, OPEN_LOBBIES } from '../data/mockData';
import { useBooking } from '../hooks/useBooking';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import HeroSection from '../components/sections/HeroSection';
import ArenaExplorerSection from '../components/sections/ArenaExplorerSection';
import PlayerProfileSection from '../components/sections/PlayerProfileSection';
import CommunitySection from '../components/sections/CommunitySection';
import EvaluationShowcaseSection from '../components/sections/EvaluationShowcaseSection';
import ArenaOwnersSection from '../components/sections/ArenaOwnersSection';
import BookingModal from '../components/modals/BookingModal';
import CreateMatchModal from '../components/modals/CreateMatchModal';
import LocationConsentModal from '../components/modals/LocationConsentModal';
import {
  locationService,
  calculateHaversineDistanceKm,
} from '../services/locationService';
import { ownerService } from '../services/ownerService';

export default function HomePage({
  onRequireAuth,
  onNavigateLogin,
  pendingAction,
  clearPendingAction,
  onEnterUserHome,
}) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleViewArenaDetails = (arena) => {
    if (isAuthenticated) {
      navigate(`/app/arena/${arena.id}`);
    } else {
      navigate(`/arena/${arena.id}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoLobbyClick = () => {
    if (isAuthenticated) {
      navigate('/app/lobbies');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const communityEl = document.getElementById('comunidade');
    if (communityEl) {
      communityEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Arena Explorer & Search Filters State
  const [dbArenas, setDbArenas] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxRadius, setMaxRadius] = useState(5);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

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

  // Lobbies & Create Match Modal State
  const [lobbies, setLobbies] = useState(OPEN_LOBBIES);
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

  const handleAddCreatedMatch = (newLobby) => {
    setLobbies((prev) => [newLobby, ...prev]);
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
        const numericDistance =
          arena.distanceKmValue !== undefined
            ? arena.distanceKmValue
            : parseFloat(String(arena.distance || '0').replace(',', '.')) || 0;
        const matchesRadius = !userLocation?.lat || numericDistance <= maxRadius;
        return matchesSport && matchesQuery && matchesRadius;
      })
      .sort((a, b) => (a.distanceKmValue ?? 9999) - (b.distanceKmValue ?? 9999));
  }, [dbArenas, selectedCategory, searchQuery, userLocation, maxRadius]);

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
        onSelectSlotForFeatured={handleSelectSlot}
        onOpenBooking={handleViewArenaDetails}
        userLocation={userLocation}
        onOpenLocationModal={() => setLocationModalOpen(true)}
      />

      <ArenaExplorerSection
        arenas={filteredArenas}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedSlots={selectedSlots}
        onSelectSlot={handleSelectSlot}
        onOpenBooking={handleProtectedBooking}
        onViewArenaDetails={handleViewArenaDetails}
      />

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

      <CreateMatchModal
        isOpen={createMatchModalOpen}
        onClose={() => setCreateMatchModalOpen(false)}
        onCreateMatch={handleAddCreatedMatch}
        currentUser={user}
      />

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
    </MainLayout>
  );
}
