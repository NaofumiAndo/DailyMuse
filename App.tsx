import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import ComicSection from './pages/ComicSection';
import StoryList from './pages/StoryList';
import StoryAtlas from './pages/StoryAtlas';
import ProductIdeas from './pages/ProductIdeas';
import { Menu, X } from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isComicSection = ['/', '/archive', '/admin'].includes(location.pathname);
  const isStorySection = location.pathname.startsWith('/story');
  const isProductIdeas = location.pathname === '/product-ideas';

  const navLinks = [
    { path: '/', label: 'Daily Comics', icon: '🎨', isActive: isComicSection, isExternal: false },
    { path: '/story', label: 'Story', icon: '📖', isActive: isStorySection, isExternal: false },
    { path: 'https://basketball-41d0f.web.app/', label: 'BASKETBALL PUZZLE', icon: '🏀', isActive: false, isExternal: true },
    { path: '/product-ideas', label: 'Product Ideas', icon: '💡', isActive: isProductIdeas, isExternal: false },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-stone-50 border-r border-stone-200 z-40 flex flex-col">
      {/* Logo */}
      <Link to="/" className="p-6 border-b border-stone-200">
        <span className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
          Daily Muse<span className="text-stone-400">.</span>
        </span>
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navLinks.map((link) => (
            <li key={link.path}>
              {link.isExternal ? (
                <a
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-sm transition-all text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-sm font-medium">{link.label}</span>
                </a>
              ) : (
                <Link
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all ${
                    link.isActive
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-stone-200">
        <p className="text-xs text-stone-400 text-center">Art by AI · Curated by Human</p>
      </div>
    </aside>
  );
};

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Daily Comics', isExternal: false },
    { path: '/story', label: 'Story', isExternal: false },
    { path: 'https://basketball-41d0f.web.app/', label: 'BASKETBALL PUZZLE', isExternal: true },
    { path: '/product-ideas', label: 'Product Ideas', isExternal: false },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-stone-50/90 backdrop-blur-sm border-b border-stone-200 z-50 md:hidden">
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
              link.isExternal ? (
                <a
                  key={link.path}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold uppercase tracking-widest transition-all duration-300 text-stone-500 hover:text-stone-900 hover:border-b-2 hover:border-stone-200 pb-1"
                >
                  {link.label}
                </a>
              ) : (
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
              )
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
        <div className="md:hidden bg-stone-50 border-b border-stone-200 animate-in slide-in-from-top-2">
          <div className="pt-4 pb-6 space-y-2 px-4">
            {navLinks.map((link) => (
              link.isExternal ? (
                <a
                  key={link.path}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-3 text-base font-serif font-medium rounded-md text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                >
                  {link.label}
                </a>
              ) : (
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
              )
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
      <div className="flex min-h-screen bg-stone-50">
        {/* Sidebar - hidden on mobile, visible on desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 md:ml-64">
          {/* Mobile navigation only */}
          <Navigation />

          <main className="flex-grow pt-20 md:pt-0">
            <Routes>
              <Route path="/*" element={<ComicSection />} />
              <Route path="/story" element={<StoryList />} />
              <Route path="/story/atlas" element={<StoryAtlas />} />
              <Route path="/product-ideas" element={<ProductIdeas />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </div>
    </HashRouter>
  );
}