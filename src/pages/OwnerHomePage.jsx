import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, NavLink } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ownerService } from '../services/ownerService';
import OwnerSidebar from '../components/layout/OwnerSidebar';
import OwnerMobileBottomNav from '../components/layout/OwnerMobileBottomNav';
import OwnerEarningsTab from '../components/owner/OwnerEarningsTab';
import OwnerScheduleTab from '../components/owner/OwnerScheduleTab';
import OwnerArenasConfigTab from '../components/owner/OwnerArenasConfigTab';
import OwnerNewBookingModal from '../components/owner/OwnerNewBookingModal';
import AccountSettingsTab from '../components/dashboard/AccountSettingsTab';

export default function OwnerHomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [arenas, setArenas] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    courtRevenue: 0,
    productsRevenue: 0,
    pendingRevenue: 0,
    totalBookingsCount: 0,
    paidBookingsCount: 0,
    averageTicket: 0,
  });
  const [loadingData, setLoadingData] = useState(true);
  const [modalArena, setModalArena] = useState(null);

  const loadOwnerDashboard = useCallback(async () => {
    try {
      setLoadingData(true);
      const data = await ownerService.getDashboardData();
      setArenas(data.arenas || []);
      setBookings(data.bookings || []);
      if (data.metrics) setMetrics(data.metrics);
    } catch {
      // Caso o servidor esteja reconectando
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadOwnerDashboard();
  }, [loadOwnerDashboard]);

  const handleSaveArena = async (arenaId, updates) => {
    const updatedArena = await ownerService.updateArena(arenaId, updates);
    setArenas((prev) =>
      prev.map((a) => (String(a._id) === String(arenaId) ? updatedArena : a))
    );
    return updatedArena;
  };

  const handleCreateArena = async (payload) => {
    const createdArena = await ownerService.createArena(payload);
    setArenas((prev) => [createdArena, ...prev]);
    return createdArena;
  };

  const handleToggleSlotStatus = async (arena, slotTime) => {
    const updatedSlots = (arena.slots || []).map((s) => {
      if (s.time === slotTime) {
        return {
          ...s,
          status: s.status === 'booked' ? 'available' : 'booked',
        };
      }
      return s;
    });
    await handleSaveArena(arena._id, { slots: updatedSlots });
  };

  const handleConfirmNewBooking = async (bookingPayload) => {
    await ownerService.createBooking(bookingPayload);
    await loadOwnerDashboard();
  };

  const handleUpdateBookingStatus = async (bookingId, statusUpdates) => {
    await ownerService.updateBookingStatus(bookingId, statusUpdates);
    await loadOwnerDashboard();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const activeBookingsCount = bookings.filter(
    (b) => b.bookingStatus !== 'cancelled'
  ).length;

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 relative pb-24 md:pb-12">
      {/* Desktop Left Sidebar */}
      <OwnerSidebar
        user={user}
        arenasCount={arenas.length}
        bookingsCount={activeBookingsCount}
        onOpenNewBooking={() => setModalArena(arenas[0] || null)}
        onLogout={handleLogout}
      />

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 border-b border-white/10 bg-dark-950/90 backdrop-blur-xl">
        <div className="px-4 h-16 flex items-center justify-between">
          <NavLink to="/proprietario/ganhos" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center text-dark-950 font-display font-black text-lg">
              SM
            </div>
            <div>
              <span className="font-display font-extrabold text-base tracking-tight text-white block leading-none">
                SPORT<span className="text-emerald-400">MAKER</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-neon">
                Painel Proprietário
              </span>
            </div>
          </NavLink>

          <div className="flex items-center gap-2">
            <button
              onClick={loadOwnerDashboard}
              title="Atualizar dados do MongoDB"
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-400"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
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

      {/* Main Content Area */}
      <main className="md:pl-64 lg:pl-72 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
          <Routes>
            <Route index element={<Navigate to="ganhos" replace />} />
            <Route
              path="ganhos"
              element={
                <OwnerEarningsTab
                  arenas={arenas}
                  bookings={bookings}
                  metrics={metrics}
                  onGoToSchedule={() => navigate('/proprietario/horarios')}
                  onGoToArenas={() => navigate('/proprietario/arenas')}
                  onMarkBookingPaid={(id) =>
                    handleUpdateBookingStatus(id, { paymentStatus: 'paid' })
                  }
                />
              }
            />
            <Route
              path="horarios"
              element={
                <OwnerScheduleTab
                  arenas={arenas}
                  bookings={bookings}
                  onOpenNewBookingModal={(arena) =>
                    setModalArena(arena || arenas[0] || null)
                  }
                  onToggleSlotStatus={handleToggleSlotStatus}
                  onUpdateBookingStatus={handleUpdateBookingStatus}
                />
              }
            />
            <Route
              path="arenas"
              element={
                <OwnerArenasConfigTab
                  arenas={arenas}
                  onSaveArena={handleSaveArena}
                  onCreateArena={handleCreateArena}
                />
              }
            />
            <Route path="configuracoes" element={<AccountSettingsTab />} />
            <Route path="*" element={<Navigate to="ganhos" replace />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <OwnerMobileBottomNav
        bookingsCount={activeBookingsCount}
        onOpenNewBooking={() => setModalArena(arenas[0] || null)}
      />

      {/* Modal para Marcar Horário no Quadro */}
      <OwnerNewBookingModal
        isOpen={Boolean(modalArena)}
        arena={modalArena}
        onClose={() => setModalArena(null)}
        onConfirmBooking={handleConfirmNewBooking}
      />
    </div>
  );
}

