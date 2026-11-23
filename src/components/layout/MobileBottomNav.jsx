import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  MapPin,
  Users,
  Calendar,
  HeartHandshake,
  User,
  Shield,
} from 'lucide-react';

const ICON_ANIMATIONS = {
  arenas: {
    y: [0, -4, 0],
    scale: [1, 1.18, 1],
    transition: { duration: 0.45, ease: 'easeOut' },
  },
  'my-matches': {
    scale: [1, 1.2, 1],
    rotate: [0, -8, 6, 0],
    transition: { duration: 0.45, ease: 'easeOut' },
  },
  lobbies: {
    scale: [1, 1.2, 0.96, 1.08, 1],
    y: [0, -3, 0],
    transition: { duration: 0.45, ease: 'easeOut' },
  },
  teams: {
    scale: [1, 1.2, 1],
    rotate: [0, 6, -6, 0],
    transition: { duration: 0.45, ease: 'easeOut' },
  },
  friends: {
    scale: [1, 1.22, 0.95, 1.1, 1],
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  profile: {
    scale: [1, 1.2, 1],
    y: [0, -3, 0],
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

export default function MobileBottomNav({
  myMatchesCount = 0,
}) {
  const navItems = [
    { id: 'arenas', path: '/app/arenas', label: 'Arenas', icon: MapPin },
    {
      id: 'my-matches',
      path: '/app/minhas-partidas',
      label: 'Partidas',
      icon: Calendar,
      badge: myMatchesCount,
    },
    { id: 'lobbies', path: '/app/lobbies', label: 'Lobby', icon: Users },
    { id: 'friends', path: '/app/amigos', label: 'Amigos', icon: HeartHandshake },
    { id: 'profile', path: '/app/perfil', label: 'Perfil', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-950/95 backdrop-blur-xl border-t border-white/15 px-2 py-2">
      <div className="max-w-3xl mx-auto grid grid-cols-5 items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl font-semibold text-[10px] sm:text-[11px] transition-colors ${
                  isActive ? 'text-neon' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="mobileNavActivePill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-neon/10 border border-neon/25 -z-10"
                    />
                  )}

                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    animate={
                      isActive
                        ? ICON_ANIMATIONS[item.id] || { scale: [1, 1.18, 1] }
                        : { scale: 1, y: 0, rotate: 0 }
                    }
                    className="relative flex items-center justify-center"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>

                  <motion.span
                    animate={{ scale: isActive ? 1.04 : 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                    className="truncate max-w-full"
                  >
                    {item.label}
                  </motion.span>

                  {item.badge > 0 && (
                    <motion.span
                      key={item.badge}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                      className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full bg-neon text-dark-950 text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(204,255,0,0.5)]"
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
