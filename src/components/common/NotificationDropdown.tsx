import React, { useEffect, useState, useRef } from 'react';
import { X, CheckCheck } from 'lucide-react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../lib/supabase';
import { NotificationWithDetails } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onCountChange
}) => {
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications(10);
      setNotifications(data as NotificationWithDetails[]);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationWithDetails) => {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
        onCountChange();
      }

      if (notification.message.quote_id) {
        window.location.hash = `quote-builder?quoteId=${notification.message.quote_id}`;
      } else if (notification.message.line_item_id) {
        window.location.hash = `quote-builder?lineItemId=${notification.message.line_item_id}`;
      }

      onClose();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await fetchNotifications();
      onCountChange();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleViewAll = () => {
    window.location.hash = 'notifications';
    onClose();
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              ({unreadCount} unread)
            </span>
          )}
        </h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
              title="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.creator.display_name}
                      </span>
                      {notification.type === 'mention' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          mentioned you
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {notification.message.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="ml-2 flex-shrink-0">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleViewAll}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};
