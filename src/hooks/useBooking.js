import { useState } from 'react';

export function isOfficialBallProduct(prod) {
  if (!prod) return false;
  return (
    prod.name.toLowerCase().includes('bola') ||
    prod.id === 'p2' ||
    prod.id === 'p6' ||
    prod.id === 'p11'
  );
}

export function useBooking(selectedSlots, setSelectedSlots, isPro = false) {
  const [activeBookingArena, setActiveBookingArena] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [splitWithFriends, setSplitWithFriends] = useState(true);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const handleOpenBooking = (arena) => {
    setActiveBookingArena(arena);
    const defaultProds = [arena.products[0]?.id].filter(Boolean);
    if (isPro) {
      const ballProd = arena.products.find(isOfficialBallProduct);
      if (ballProd && !defaultProds.includes(ballProd.id)) {
        defaultProds.push(ballProd.id);
      }
    }
    setSelectedProducts(defaultProds);
    setBookingConfirmed(false);
  };

  const handleCloseBooking = () => {
    setActiveBookingArena(null);
  };

  const toggleProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleSplitWithFriends = () => {
    setSplitWithFriends((prev) => !prev);
  };

  const confirmBooking = () => {
    setBookingConfirmed(true);
  };

  const handleSelectSlot = (arenaId, slotTime) => {
    setSelectedSlots((prev) => ({ ...prev, [arenaId]: slotTime }));
  };

  const calculateTotal = (arena) => {
    if (!arena) return 0;
    const courtPrice = isPro ? Math.round(arena.pricePerHour * 0.85) : arena.pricePerHour;
    const productsSum = arena.products
      .filter((p) => selectedProducts.includes(p.id))
      .reduce((acc, item) => {
        if (isPro && isOfficialBallProduct(item)) {
          return acc;
        }
        return acc + item.price;
      }, 0);
    return courtPrice + productsSum;
  };

  return {
    activeBookingArena,
    selectedProducts,
    splitWithFriends,
    bookingConfirmed,
    totalAmount: calculateTotal(activeBookingArena),
    handleOpenBooking,
    handleCloseBooking,
    toggleProduct,
    toggleSplitWithFriends,
    confirmBooking,
    handleSelectSlot,
  };
}

