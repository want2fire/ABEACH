import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

interface HeaderProps {
  userName: string | null;
  userRole: string | null;
  onSignOut: () => void;
  isHomePage?: boolean;
}

const Header: React.FC<HeaderProps> = ({ userName, userRole, onSignOut, isHomePage = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const textColorClass = isHomePage ? 'text-stone-900' : 'text-stone-900';
  const subTextColorClass = isHomePage ? 'text-stone-500' : 'text-stone-500';
  
  const glassPanelClass = isHomePage 
    ? 'bg-white/90 backdrop-blur-md border-b border-stone-100 text-stone-900 shadow-sm' 
    : 'glass-panel text-stone-900';

  const activeLinkClass = `font-bold after:content-[''] after:block after:w-full after:h-0.5 after:bg-pizza-500 after:mt-1 after:scale-100 transition-all text-pizza-600`;
  const inactiveLinkClass = `transition-colors font-medium after:content-[''] after:block after:w-full after:h-0.5 after:bg-pizza-500 after:mt-1 after:scale-0 hover:after:scale-50 after:transition-transform text-stone-500 hover:text-stone-900`;
  const linkClasses = "px-3 py-2 text-sm tracking-wide relative font-sans whitespace-nowrap";

  const getRoleName = (role: string) => {
      switch(role) {
          case 'admin': return '管理員';
          case 'duty': return '值班';
          case 'user': return '夥伴';
          default: return '員工';
      }
  };

  // Logic to determine if user can see lists
  const canViewLists = userRole === 'admin' || userRole === 'duty';

  const navLinks = (
    <>
      {canViewLists && (
        <>
          <NavLink
            to="/personnel-list"
            className={({ isActive }) => `${isActive ? activeLinkClass : inactiveLinkClass} ${linkClasses}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            夥伴名單
          </NavLink>
          <NavLink
            to="/training-items"
            className={({ isActive }) => `${isActive ? activeLinkClass : inactiveLinkClass} ${linkClasses}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            學習進度
          </NavLink>
        </>
      )}
      {userRole === 'admin' && (
        <NavLink
          to="/user-management"
          className={({ isActive }) => `${isActive ? activeLinkClass : inactiveLinkClass} ${linkClasses}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          管理後台
        </NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 pt-4 px-4">
      <nav className="container mx-auto">
        <div className={`${glassPanelClass} rounded-full px-6 md:px-8 py-4 flex items-center justify-between transition-all duration-300`}>
          
          {/* Logo / Title - Click to go Home */}
          <Link to="/" className="flex items-center gap-6 group min-w-fit">
            <h1 className={`text-2xl font-syne font-bold tracking-wider hidden sm:block ${textColorClass} group-hover:opacity-80 transition-opacity whitespace-nowrap`}>
              A BEACH 101 <span className="text-pizza-500">& PIZZA</span>
            </h1>
            <h1 className="sm:hidden text-xl font-syne font-bold text-pizza-500">101</h1>
            
            {/* Desktop Menu */}
            <div className={`hidden md:flex items-baseline space-x-2 lg:space-x-6 ml-4 border-l ${isHomePage ? 'border-stone-300/50' : 'border-stone-300'} pl-6 overflow-x-auto scrollbar-hide`}>
              {navLinks}
            </div>
          </Link>

          {/* User Info */}
          <div className="flex items-center space-x-5 min-w-fit">
            {userName && (
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                    <div className={`text-sm font-bold ${textColorClass}`}>{userName}</div>
                    {userRole && <div className="text-[10px] text-pizza-600 font-bold tracking-widest">{getRoleName(userRole)}</div>}
                </div>
                <button 
                  onClick={onSignOut}
                  className={`text-xs font-bold border border-stone-300 text-stone-500 hover:text-pizza-600 hover:bg-white/50 hover:border-pizza-500 py-2 px-5 rounded-full transition-all duration-300 tracking-wider whitespace-nowrap`}
                >
                  登出
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className={`${subTextColorClass} hover:${textColorClass} focus:outline-none`}
              >
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className={`md:hidden mt-2 rounded-2xl p-6 space-y-4 animate-fade-in mx-2 glass-panel`}>
            <div className="flex flex-col space-y-4">
              {navLinks}
            </div>
            {userName && (
               <div className={`pt-6 mt-4 border-t border-stone-200`}>
                 <div className="flex justify-between items-center mb-4">
                    <span className={`text-sm font-bold ${textColorClass}`}>{userName}</span>
                    {userRole && <span className="text-xs text-pizza-600 font-bold">{getRoleName(userRole)}</span>}
                 </div>
                 <button 
                    onClick={onSignOut}
                    className={`block w-full text-center border rounded-lg py-3 text-xs font-bold uppercase tracking-widest text-stone-500 border-stone-300 hover:bg-white/50`}
                  >
                    登出
                  </button>
               </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;