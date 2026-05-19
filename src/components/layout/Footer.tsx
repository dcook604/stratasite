import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant mt-section-gap">
      <div className="max-w-container-max mx-auto px-gutter py-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          {/* Brand & Address */}
          <div className="flex flex-col gap-6 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex spectrum-logo-bars gap-1 items-end h-6">
                <div className="w-1.5 h-3 bg-spectrum-red rounded-sm"></div>
                <div className="w-1.5 h-4 bg-spectrum-green rounded-sm"></div>
                <div className="w-1.5 h-6 bg-spectrum-blue rounded-sm"></div>
                <div className="w-1.5 h-4 bg-spectrum-yellow rounded-sm"></div>
              </div>
              <span className="text-title-lg font-bold text-on-surface">Spectrum 4</span>
            </div>
            <p className="text-body-md text-on-surface-variant">
              602 Citadel Parade<br />
              Vancouver, BC V6B 1X2<br />
              Council@spectrum4.ca
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-12">
            <div className="flex flex-col gap-4">
              <h5 className="text-label-md uppercase tracking-widest text-on-surface-variant">Quick Links</h5>
              <Link to="/" className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Home</Link>
              <Link to="/bylaws" className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Bylaws</Link>
              <Link to="/preferred-vendors" className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Vendors</Link>
              <Link to="/documents" className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Documents</Link>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="text-label-md uppercase tracking-widest text-on-surface-variant">Support</h5>
              <Link to="/incident-report" className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Report an Issue</Link>
              <Link to="/incident-status" className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Incident Status</Link>
              <Link to="/admin/login" className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Admin Login</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-outline-variant/30">
        <div className="max-w-container-max mx-auto px-gutter py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-body-md text-on-surface-variant opacity-70">
            &copy; {new Date().getFullYear()} Spectrum 4 BCS2611. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="https://stratasite.app" className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors opacity-70 hover:opacity-100">
              StrataSite
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
