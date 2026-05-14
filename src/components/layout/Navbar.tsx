import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Book, Mail, Menu, X, LogIn, ChevronDown, ShoppingCart, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [formsOpen, setFormsOpen] = React.useState(false);
  const [infoOpen, setInfoOpen] = React.useState(false);
  const { adminUser } = useAdminAuth();

  const informationItems = [
    { name: 'Documents', path: '/documents' },
    { name: 'Fees', path: '/fees' },
    { name: 'Organics', path: '/organics' },
    { name: 'Recycling', path: '/recycling' },
    { name: 'Renovations', path: '/renovations' },
    { name: 'Welcome Package', path: '/welcome-package' },
    { name: 'Preferred Vendors', path: '/preferred-vendors' },
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

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-black">Spectrum 4</h1>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex sm:items-center sm:gap-1">
              {/* Core links */}
              <Button variant="ghost" className="text-gray-700 hover:text-primary" asChild>
                <Link to="/" className="flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>

              <Button variant="ghost" className="text-gray-700 hover:text-primary" asChild>
                <Link to="/bylaws" className="flex items-center">
                  <Book className="h-4 w-4 mr-2" />
                  Bylaws
                </Link>
              </Button>

              <Button variant="ghost" className="text-gray-700 hover:text-primary" asChild>
                <Link to="/contact" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact
                </Link>
              </Button>

              {/* Forms dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-700 hover:text-primary flex items-center">
                    Forms
                    <ChevronDown className="h-4 w-4 ml-1" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-white">
                  {formsItems.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link to={item.path} className="w-full">
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Information dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-700 hover:text-primary flex items-center">
                    Information
                    <ChevronDown className="h-4 w-4 ml-1" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-white">
                  {informationItems.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link to={item.path} className="w-full">
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-200 mx-1" />

              {/* Login / Dashboard */}
              {adminUser ? (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/dashboard" className="flex items-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/login" className="flex items-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
              )}
            </div>

          {/* Mobile hamburger */}
          <div className="flex sm:hidden items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="text-gray-700"
              >
                {isMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={cn("sm:hidden", isMenuOpen ? "block" : "hidden")}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {/* Core links */}
          <Link
            to="/"
            className="flex items-center text-gray-700 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Link>

          <Link
            to="/bylaws"
            className="flex items-center text-gray-700 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            <Book className="h-4 w-4 mr-2" />
            Bylaws
          </Link>

          <Link
            to="/contact"
            className="flex items-center text-gray-700 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact
          </Link>

          {/* Forms accordion */}
          <div>
            <button
              className="flex items-center justify-between w-full text-gray-700 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setFormsOpen(!formsOpen)}
              aria-expanded={formsOpen}
            >
              <span className="flex items-center">
                <ShieldAlert className="h-4 w-4 mr-2" />
                Forms
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", formsOpen && "rotate-180")} />
            </button>
            {formsOpen && (
              <div className="pl-5 space-y-1 mt-1">
                {formsItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center text-gray-600 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm"
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
              className="flex items-center justify-between w-full text-gray-700 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setInfoOpen(!infoOpen)}
              aria-expanded={infoOpen}
            >
              <span>Information</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", infoOpen && "rotate-180")} />
            </button>
            {infoOpen && (
              <div className="pl-5 space-y-1 mt-1">
                {informationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center text-gray-600 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2" />

          {/* Login / Dashboard */}
          {adminUser ? (
            <Link
              to="/admin/dashboard"
              className="flex items-center text-gray-700 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          ) : (
            <Link
              to="/admin/login"
              className="flex items-center text-gray-700 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
