import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Calendar, Image, Book, Mail, Menu, X, LogIn, ChevronDown, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const { adminUser } = useAdminAuth();

  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="h-4 w-4 mr-2" /> },
  ];

  const informationItems = [
    { name: 'Documents', path: '/documents' },
    { name: 'Fees', path: '/fees' },
    { name: 'Organics', path: '/organics' },
    { name: 'Recycling', path: '/recycling' },
    { name: 'Renovations', path: '/renovations' },
    { name: 'Welcome Package', path: '/welcome-package' },
  ];

  const formsItems = [
    { name: 'Scooter Registration', path: '/scooter-registration' },
    { name: 'Emergency Contact', path: '/emergency-contact' },
    { name: 'AC Inquiry', path: '/ac-inquiry' },
    { name: 'Storage Rental', path: '/storage-rental' },
    { name: 'Pet Registration', path: '/pet-registration' },
    { name: 'Form K - Notice of Tenant\'s Responsibilities', path: '/form-k' },
  ];

  const mainNavItems = [
    { name: 'Calendar', path: '/calendar', icon: <Calendar className="h-4 w-4 mr-2" /> },
    { name: 'Contact', path: '/contact', icon: <Mail className="h-4 w-4 mr-2" /> },
    { name: 'Bylaws', path: '/bylaws', icon: <Book className="h-4 w-4 mr-2" /> },
    { name: 'Marketplace', path: '/marketplace', icon: <ShoppingCart className="h-4 w-4 mr-2" /> },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-black">Spectrum 4</h1>
            </Link>
          </div>
          
          {!isMobile && (
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="flex space-x-4">
                {/* Home */}
                {navItems.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="text-gray-700 hover:text-primary"
                    asChild
                  >
                    <Link to={item.path} className="flex items-center">
                      {item.icon}
                      {item.name}
                    </Link>
                  </Button>
                ))}

                {/* Calendar and Contact */}
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-primary"
                  asChild
                >
                  <Link to="/calendar" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-primary"
                  asChild
                >
                  <Link to="/contact" className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Link>
                </Button>

                {/* Bylaws */}
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-primary"
                  asChild
                >
                  <Link to="/bylaws" className="flex items-center">
                    <Book className="h-4 w-4 mr-2" />
                    Bylaws
                  </Link>
                </Button>

                {/* Forms Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-gray-700 hover:text-primary flex items-center">
                      Forms
                      <ChevronDown className="h-4 w-4 ml-1" />
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

                {/* Information Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-gray-700 hover:text-primary flex items-center">
                      Information
                      <ChevronDown className="h-4 w-4 ml-1" />
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

                {/* Marketplace */}
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-primary"
                  asChild
                >
                  <Link to="/marketplace" className="flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Marketplace
                  </Link>
                </Button>

                {adminUser ? (
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-primary"
                    asChild
                  >
                    <Link to="/admin/dashboard" className="flex items-center">
                      <LogIn className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-primary"
                    asChild
                  >
                    <Link to="/admin/login" className="flex items-center">
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}

          {isMobile && (
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "sm:hidden",
          isMenuOpen ? "block" : "hidden"
        )}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {/* Home */}
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center text-gray-700 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
          
          {/* Calendar */}
          <Link
            to="/calendar"
            className="flex items-center text-gray-700 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Link>

          {/* Contact */}
          <Link
            to="/contact"
            className="flex items-center text-gray-700 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact
          </Link>

          {/* Bylaws */}
          <Link
            to="/bylaws"
            className="flex items-center text-gray-700 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            <Book className="h-4 w-4 mr-2" />
            Bylaws
          </Link>
          
          {/* Forms section in mobile menu */}
          <div className="block">
            <div className="px-3 py-2 font-medium text-gray-700">Forms</div>
            <div className="pl-5 space-y-1">
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
          </div>
          
          {/* Information section in mobile menu */}
          <div className="block">
            <div className="px-3 py-2 font-medium text-gray-700">Information</div>
            <div className="pl-5 space-y-1">
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
          </div>

          {/* Marketplace */}
          <Link
            to="/marketplace"
            className="flex items-center text-gray-700 hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Marketplace
          </Link>

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
