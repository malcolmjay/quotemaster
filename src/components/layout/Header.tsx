import React, { useState, useEffect } from 'react';
import { Building2, User, Bell, Sun, Moon, LogOut, HelpCircle } from 'lucide-react';
import { useAuthContext } from '../auth/AuthProvider';
import { useCustomer } from '../../context/CustomerContext';
import { useSupabaseQuote } from '../../context/SupabaseQuoteContext';
import { useTheme } from '../../context/ThemeContext';
import { useHelp } from '../../context/HelpContext';
import { useToast } from '../../context/ToastContext';
import { HelpTooltip } from '../common/HelpTooltip';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { getUnreadNotificationCount, subscribeToNotifications } from '../../lib/supabase';

export const Header: React.FC = () => {
  const { user, signOut } = useAuthContext();
  const { selectedCustomer } = useCustomer();
  const { quotes } = useSupabaseQuote();
  const { theme, toggleTheme } = useTheme();
  const { helpMode, toggleHelpMode } = useHelp();
  const { showToast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Calculate quote statistics
  const totalQuotes = quotes.length;
  const draftQuotes = quotes.filter(q => q.status === 'draft').length;
  const sentQuotes = quotes.filter(q => q.status === 'sent').length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    };

    fetchUnreadCount();

    const subscription = subscribeToNotifications(() => {
      fetchUnreadCount();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
    } catch (error) {
      showToast('error', 'Logout failed', 'Please try again or close the browser window.');
    } finally {
      setLoggingOut(false);
    }
  };

  const refreshNotificationCount = async () => {
    const count = await getUnreadNotificationCount();
    setUnreadCount(count);
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
            <HelpTooltip content={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode. Dark mode is easier on the eyes in low-light environments.`}>
              <button
                onClick={toggleTheme}
                className="p-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded transition-colors"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </HelpTooltip>

            <button
              onClick={toggleHelpMode}
              className={`p-2 rounded transition-colors ${
                helpMode
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  : 'text-[#666] hover:text-[#333] hover:bg-[#f5f5f5]'
              }`}
              title={`${helpMode ? 'Disable' : 'Enable'} help mode - Shows helpful tooltips when hovering over buttons and fields`}
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            <HelpTooltip content="View system notifications and important alerts. Stay informed about quote approvals and status changes.">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded transition-colors relative"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                  onCountChange={refreshNotificationCount}
                />
              </div>
            </HelpTooltip>

            <HelpTooltip content="Your user profile information. This shows your name and email address associated with your account.">
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
            </HelpTooltip>

            <HelpTooltip content="Log out of your account. You will need to sign in again to access the system.">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-2 text-[#666] hover:text-[#a94442] hover:bg-[#f2dede] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </HelpTooltip>
          </div>
        </div>
      </div>
    </header>
  );
};