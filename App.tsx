import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Archive from './pages/Archive';
import Admin from './pages/Admin';
import { Menu, X } from 'lucide-react';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Today' },
    { path: '/archive', label: 'Archive' },
    { path: '/admin', label: 'Creator' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-stone-50/90 backdrop-blur-sm border-b border-stone-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group">
            <span className="font-serif text-2xl font-semibold tracking-tight text-stone-900 group-hover:text-stone-600 transition-colors">
              Daily Muse<span className="text-stone-400">.</span>
            </span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden sm:flex sm:items-center sm:space-x-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  location.pathname === link.path
                    ? 'text-stone-900 border-b-2 border-stone-900 pb-1'
                    : 'text-stone-500 hover:text-stone-900 hover:border-b-2 hover:border-stone-200 pb-1'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-stone-500 hover:text-stone-900 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="sm:hidden bg-stone-50 border-b border-stone-200 animate-in slide-in-from-top-2">
          <div className="pt-4 pb-6 space-y-2 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-3 text-base font-serif font-medium rounded-md ${
                  location.pathname === link.path
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer: React.FC = () => (
  <footer className="bg-stone-50 border-t border-stone-200 mt-auto">
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-px bg-stone-300"></div>
      <p className="text-center text-xs tracking-widest text-stone-400 uppercase">
        Art by AI &middot; Curated by Human
      </p>
    </div>
  </footer>
);

export default function App() {
  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-stone-50">
        <Navigation />
        <main className="flex-grow pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}