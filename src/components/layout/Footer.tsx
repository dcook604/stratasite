
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Strata Council</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <p className="text-sm text-gray-600">123 Main Street</p>
              </li>
              <li>
                <p className="text-sm text-gray-600">City, State 12345</p>
              </li>
              <li>
                <p className="text-sm text-gray-600">info@stratacouncil.com</p>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-base font-semibold text-gray-900">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary">Home</Link>
              </li>
              <li>
                <Link to="/calendar" className="text-sm text-gray-600 hover:text-primary">Calendar</Link>
              </li>
              <li>
                <Link to="/gallery" className="text-sm text-gray-600 hover:text-primary">Gallery</Link>
              </li>
              <li>
                <Link to="/bylaws" className="text-sm text-gray-600 hover:text-primary">Bylaws</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-base font-semibold text-gray-900">Support</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-primary">Contact Us</Link>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary">Emergency Contact</a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary">Privacy Policy</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">&copy; {new Date().getFullYear()} Strata Council. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
