import React, { useState } from 'react';
import { Building2, User, Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useAuthContext } from '../auth/AuthProvider';
import { useCustomer } from '../../context/CustomerContext';
import { useSupabaseQuote } from '../../context/SupabaseQuoteContext';
import { useTheme } from '../../context/ThemeContext';

export const Header: React.FC = () => {
  const { user, signOut } = useAuthContext();
  const { selectedCustomer } = useCustomer();
  const { quotes } = useSupabaseQuote();
  const { theme, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  // Calculate quote statistics
  const totalQuotes = quotes.length;
  const draftQuotes = quotes.filter(q => q.status === 'draft').length;
  const sentQuotes = quotes.filter(q => q.status === 'sent').length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 fixed top-0 left-0 right-0 z-20 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 ml-12 lg:ml-0">
          <Building2 className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">Quote and Bid Management Tool</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 lg:space-x-6">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors">
              <Bell className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-28">
                  {user?.email || 'No Email'}
                </span>
              </div>
              <div className="hidden sm:flex items-center space-x-1">
                {selectedCustomer && (
                  <></>
                )}
              </div>
              <User className="h-6 w-6 text-gray-400 dark:text-gray-300" />
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};