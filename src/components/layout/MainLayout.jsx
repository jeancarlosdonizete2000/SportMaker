import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function MainLayout({
  children,
  onNavigateLogin,
  onCreateMatchClick,
  onEnterUserHome,
}) {
  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 relative">
      <Navbar
        onNavigateLogin={onNavigateLogin}
        onCreateMatchClick={onCreateMatchClick}
        onEnterUserHome={onEnterUserHome}
      />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
