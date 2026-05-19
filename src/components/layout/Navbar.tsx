import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Menu, X } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

const informationItems = [
  { name: 'Documents', path: '/documents' },
  { name: 'Fees', path: '/fees' },
  { name: 'Organics', path: '/organics' },
  { name: 'Recycling', path: '/recycling' },
  { name: 'Renovations', path: '/renovations' },
  { name: 'Welcome Package', path: '/welcome-package' },
  { name: 'Preferred Vendors', path: '/preferred-vendors' },
  { name: 'Help & Support', path: '/support' },
];

const formsItems = [
  { name: 'Incident Report', path: '/incident-report' },
  { name: 'Scooter Registration', path: '/scooter-registration' },
  { name: 'Emergency Contact', path: '/emergency-contact' },
  { name: 'AC Inquiry', path: '/ac-inquiry' },
  { name: 'Storage Locker Signup', path: '/storage-locker-signup' },
  { name: 'Pet Registration', path: '/pet-registration' },
  { name: 'Form K', path: '/form-k' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [formsOpen, setFormsOpen] = React.useState(false);
  const [infoOpen, setInfoOpen] = React.useState(false);
  const { adminUser } = useAdminAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-white dark:bg-on-primary-container border-b border-outline-variant shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex spectrum-logo-bars gap-1 items-end h-8">
              <div className="w-2 h-4 bg-spectrum-red rounded-sm"></div>
              <div className="w-2 h-6 bg-spectrum-green rounded-sm"></div>
              <div className="w-2 h-8 bg-spectrum-blue rounded-sm"></div>
              <div className="w-2 h-6 bg-spectrum-yellow rounded-sm"></div>
            </div>
            <span className="text-headline-md font-bold text-on-surface">Spectrum 4</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-title-lg transition-colors ${
                isActive('/')
                  ? 'text-secondary border-b-2 border-secondary pb-1'
                  : 'text-on-surface-variant hover:text-secondary'
              }`}
            >
              Home
            </Link>
            <Link
              to="/bylaws"
              className={`text-title-lg transition-colors ${
                isActive('/bylaws')
                  ? 'text-secondary border-b-2 border-secondary pb-1'
                  : 'text-on-surface-variant hover:text-secondary'
              }`}
            >
              Bylaws
            </Link>

            {/* Forms Dropdown */}
            <div className="relative group">
              <button className="text-title-lg text-on-surface-variant hover:text-secondary transition-colors flex items-center gap-1">
                Forms
                <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white border border-outline-variant rounded-xl shadow-xl py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {formsItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="block px-4 py-2.5 text-sm font-medium text-[#151c27] hover:bg-[#e7eefe] hover:text-secondary transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Information Dropdown */}
            <div className="relative group">
              <button className="text-title-lg text-on-surface-variant hover:text-secondary transition-colors flex items-center gap-1">
                Information
                <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white border border-outline-variant rounded-xl shadow-xl py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {informationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="block px-4 py-2.5 text-sm font-medium text-[#151c27] hover:bg-[#e7eefe] hover:text-secondary transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t border-outline-variant my-1"></div>
                <Link
                  to="/incident-status"
                  className="block px-4 py-2.5 text-sm font-medium text-spectrum-red hover:bg-red-50 transition-colors"
                >
                  Incident Status
                </Link>
              </div>
            </div>

            <Link
              to="/preferred-vendors"
              className={`text-title-lg transition-colors ${
                isActive('/preferred-vendors')
                  ? 'text-secondary border-b-2 border-secondary pb-1'
                  : 'text-on-surface-variant hover:text-secondary'
              }`}
            >
              Vendors
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <Link
              to="/incident-report"
              className="hidden lg:flex items-center gap-2 bg-error-container text-on-error-container px-4 py-2 rounded-full text-xs font-semibold hover:brightness-95 transition-all"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Report Issue
            </Link>
            {adminUser ? (
              <Link
                to="/admin/dashboard"
                className="bg-primary-container text-on-primary px-5 py-2 rounded-full text-label-md hover:brightness-110 transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="bg-primary-container text-on-primary px-5 py-2 rounded-full text-label-md hover:brightness-110 transition-all"
              >
                Admin Login
              </Link>
            )}
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1 text-on-surface-variant hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-outline-variant bg-white">
            <div className="px-gutter py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-2.5 text-body-md text-on-surface-variant hover:bg-surface-container-low rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">home</span>
                Home
              </Link>
              <Link
                to="/bylaws"
                className="flex items-center gap-3 px-3 py-2.5 text-body-md text-on-surface-variant hover:bg-surface-container-low rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">description</span>
                Bylaws
              </Link>

              {/* Forms accordion */}
              <div>
                <button
                  className="flex items-center justify-between w-full px-3 py-2.5 text-body-md text-on-surface-variant hover:bg-surface-container-low rounded-lg"
                  onClick={() => setFormsOpen(!formsOpen)}
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">assignment</span>
                    Forms
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${formsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {formsOpen && (
                  <div className="ml-7 space-y-1 mt-1">
                    {formsItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className="block px-3 py-2 text-body-md text-on-surface-variant hover:bg-surface-container-low rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Information accordion */}
              <div>
                <button
                  className="flex items-center justify-between w-full px-3 py-2.5 text-body-md text-on-surface-variant hover:bg-surface-container-low rounded-lg"
                  onClick={() => setInfoOpen(!infoOpen)}
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                    Information
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${infoOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {infoOpen && (
                  <div className="ml-7 space-y-1 mt-1">
                    {informationItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className="block px-3 py-2 text-body-md text-on-surface-variant hover:bg-surface-container-low rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/preferred-vendors"
                className="flex items-center gap-3 px-3 py-2.5 text-body-md text-on-surface-variant hover:bg-surface-container-low rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">handyman</span>
                Vendors
              </Link>

              <div className="border-t border-outline-variant my-2"></div>

              <Link
                to="/incident-report"
                className="flex items-center gap-3 px-3 py-2.5 text-body-md text-spectrum-red hover:bg-surface-container-low rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">report</span>
                Report Issue
              </Link>

              {adminUser ? (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-3 px-3 py-2.5 text-body-md text-on-surface-variant hover:bg-surface-container-low rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[20px]">dashboard</span>
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/admin/login"
                  className="flex items-center gap-3 px-3 py-2.5 text-body-md text-on-surface-variant hover:bg-surface-container-low rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-white border-t border-outline-variant shadow-lg md:hidden">
        <Link to="/" className={`flex flex-col items-center justify-center ${isActive('/') ? 'text-secondary' : 'text-on-surface-variant'}`}>
          <span className={`material-symbols-outlined ${isActive('/') ? 'fill-1' : ''}`}>home</span>
          <span className="text-xs font-semibold text-[10px] uppercase mt-0.5">Home</span>
        </Link>
        <Link to="/bylaws" className={`flex flex-col items-center justify-center ${isActive('/bylaws') ? 'text-secondary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">description</span>
          <span className="text-xs font-semibold text-[10px] uppercase mt-0.5">Bylaws</span>
        </Link>
        <Link to="/preferred-vendors" className={`flex flex-col items-center justify-center ${isActive('/preferred-vendors') ? 'text-secondary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">handyman</span>
          <span className="text-xs font-semibold text-[10px] uppercase mt-0.5">Vendors</span>
        </Link>
        <Link to="/support" className={`flex flex-col items-center justify-center ${isActive('/support') ? 'text-secondary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">support_agent</span>
          <span className="text-xs font-semibold text-[10px] uppercase mt-0.5">Support</span>
        </Link>
      </nav>
      {/* Spacer for mobile bottom nav */}
      <div className="h-16 md:hidden"></div>
    </>
  );
};

export default Navbar;
