import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Home, Briefcase, ArrowLeftRight, Settings, LogIn, UserPlus, LogOut } from 'lucide-react';

interface NavigationProps {
  userRole?: 'user' | 'admin' | null;
  onLogout?: () => void;
}

export function Navigation({ userRole, onLogout }: NavigationProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Links ONLY for user role (not for admin)
  const userLinks = userRole === 'user' ?  [
    { path: '/', label: 'Dashboard', icon:  Home },
    { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { path: '/trade', label:  'Trade', icon: ArrowLeftRight },
  ] : [];

  // Links ONLY for admin role
  const adminLinks = userRole === 'admin' ? [
    { path: '/admin', label:  'Admin', icon: Settings },
  ] : [];

  // Links for non-authenticated users
  const guestLinks = [
    { path: '/login', label: 'Login', icon: LogIn },
    { path: '/register', label: 'Register', icon: UserPlus },
  ];

  // Combine links based on role
  const navLinks = userRole 
    ? [... userLinks, ...adminLinks]  // User OR Admin Links
    : guestLinks;                     // Gast Links

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span className="text-gray-900 font-semibold text-xl">ShareSphere</span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Navigation Links */}
            <div className="flex gap-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md transition-colors
                    ${isActive(path)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      :  'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
            
            {/* Logout Button nur wenn eingeloggt */}
            {userRole && onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 ml-2 rounded-md text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}