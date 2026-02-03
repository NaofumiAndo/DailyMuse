import React from 'react';
import { Link, useLocation, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Archive from './Archive';
import Admin from './Admin';

const ComicSection: React.FC = () => {
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'Today' },
    { path: '/archive', label: 'Archive' },
    { path: '/admin', label: 'Creator' },
  ];

  return (
    <div className="min-h-screen">
      {/* Tab Navigation - Top Right */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h2 className="text-xl font-serif text-stone-900 font-semibold">Daily Comics</h2>

            {/* Tabs */}
            <nav className="flex gap-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`px-4 py-2 text-sm font-medium rounded-sm transition-all ${
                    location.pathname === tab.path
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
};

export default ComicSection;
