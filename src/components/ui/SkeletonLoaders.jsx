import React from 'react';

export function SkeletonBox({ className = '' }) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl bg-white/[0.06] border border-white/[0.05] ${className}`}
    />
  );
}

/**
 * Skeleton para transições de abas no painel (Suspense fallback)
 */
export function TabPageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner Skeleton */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2.5 flex-1">
          <SkeletonBox className="h-3.5 w-36 rounded-full" />
          <SkeletonBox className="h-7 w-64 max-w-full" />
          <SkeletonBox className="h-3.5 w-96 max-w-full" />
        </div>
        <SkeletonBox className="h-11 w-44 rounded-xl shrink-0" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="glass-card rounded-3xl p-5 border border-white/10 space-y-4"
          >
            <SkeletonBox className="h-40 w-full rounded-2xl" />
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <SkeletonBox className="h-5 w-44" />
                <SkeletonBox className="h-5 w-16 rounded-full" />
              </div>
              <SkeletonBox className="h-3.5 w-56" />
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <SkeletonBox className="h-8 w-20 rounded-lg" />
              <SkeletonBox className="h-8 w-20 rounded-lg" />
              <SkeletonBox className="h-8 flex-1 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton de tela cheia para carregamento inicial da aplicação (App.jsx)
 */
export function FullAppSkeleton() {
  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      {/* Fake Sidebar on Desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 lg:w-72 md:fixed md:inset-y-0 md:left-0 bg-dark-950 border-r border-white/10 p-5 space-y-6">
        <div className="flex items-center gap-3 px-2">
          <SkeletonBox className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <SkeletonBox className="h-5 w-28" />
            <SkeletonBox className="h-2.5 w-20" />
          </div>
        </div>
        <SkeletonBox className="h-11 w-full rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonBox key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="md:pl-64 lg:pl-72">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
          <TabPageSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton específico para a página de Detalhes da Partida
 */
export function MatchDetailsSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-3">
        <SkeletonBox className="h-10 w-44 rounded-xl" />
        <SkeletonBox className="h-10 w-36 rounded-xl" />
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
        <div className="flex flex-wrap gap-2">
          <SkeletonBox className="h-6 w-40 rounded-full" />
          <SkeletonBox className="h-6 w-28 rounded-lg" />
          <SkeletonBox className="h-6 w-32 rounded-lg" />
        </div>
        <SkeletonBox className="h-9 w-80 max-w-full" />
        <SkeletonBox className="h-4 w-64 max-w-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 border border-white/10 space-y-4">
          <SkeletonBox className="h-6 w-52" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-dark-950/60">
              <SkeletonBox className="w-11 h-11 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <SkeletonBox className="h-4 w-40" />
                <SkeletonBox className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-white/10 space-y-4">
          <SkeletonBox className="h-6 w-40" />
          <SkeletonBox className="h-44 w-full rounded-2xl" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton de lista de cards compactos (Amigos, Notificações, Partidas)
 */
export function ListCardsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="glass-card rounded-2xl p-5 border border-white/10 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 flex-1">
            <SkeletonBox className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <SkeletonBox className="h-4 w-36" />
              <SkeletonBox className="h-3 w-24" />
            </div>
          </div>
          <SkeletonBox className="h-9 w-24 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
}
