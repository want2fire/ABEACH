import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeLinkClass = "bg-sky-600 text-white";
  const inactiveLinkClass = "text-sky-100 hover:bg-sky-500 hover:text-white";
  const linkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors";

  const navLinks = (
    <>
      <NavLink
        to="/"
        className={({ isActive }) => `${isActive ? activeLinkClass : inactiveLinkClass} ${linkClasses}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        人員名單
      </NavLink>
      <NavLink
        to="/training-items"
        className={({ isActive }) => `${isActive ? activeLinkClass : inactiveLinkClass} ${linkClasses}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        學習項目管理
      </NavLink>
    </>
  );

  return (
    <header className="bg-sky-700 shadow-md sticky top-0 z-10">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Desktop Menu */}
            <div className="hidden md:flex items-baseline space-x-4">
              {navLinks}
            </div>
          </div>
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-white">學習進度追蹤器</h1>
          </div>
          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="bg-sky-700 inline-flex items-center justify-center p-2 rounded-md text-sky-200 hover:text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-700 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu, show/hide based on menu state. */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-sky-700" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
            {navLinks}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;