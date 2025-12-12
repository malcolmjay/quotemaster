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
    <header className="bg-white border-b border-[#d4d4d4] px-4 lg:px-6 py-3 fixed top-0 left-0 right-0 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 ml-12 lg:ml-0">
          <Building2 className="h-6 w-6 text-[#428bca]" />
          <div>
            <h1 className="text-base font-semibold text-[#333]">Quote and Bid Management Tool</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 lg:space-x-6">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <button className="p-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded transition-colors">
              <Bell className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-2 px-2 py-1 hover:bg-[#f5f5f5] rounded transition-colors">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-[#333]">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-xs text-[#666] truncate max-w-28">
                  {user?.email || 'No Email'}
                </span>
              </div>
              <User className="h-5 w-5 text-[#666]" />
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 text-[#666] hover:text-[#a94442] hover:bg-[#f2dede] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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