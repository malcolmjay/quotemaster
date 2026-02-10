import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, MessageSquare } from 'lucide-react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../lib/supabase';
import { NotificationWithDetails } from '../../types';
import { useToast } from '../../context/ToastContext';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { showToast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications(100);
      setNotifications(data as NotificationWithDetails[]);
    } catch (error) {
      showToast('error', 'Failed to load notifications', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationWithDetails) => {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
        await fetchNotifications();
      }

      if (notification.message.quote_id) {
        window.location.hash = `quote-builder?quoteId=${notification.message.quote_id}`;
      } else if (notification.message.line_item_id) {
        window.location.hash = `quote-builder?lineItemId=${notification.message.line_item_id}`;
      }
    } catch (error) {
      showToast('error', 'Could not update notification', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await fetchNotifications();
    } catch (error) {
      showToast('error', 'Could not mark all as read', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : 'When someone mentions you in a message, it will appear here.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      notification.type === 'mention'
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <MessageSquare className={`h-5 w-5 ${
                        notification.type === 'mention'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {notification.creator.display_name}
                        </span>
                        {notification.type === 'mention' && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            mentioned you
                          </span>
                        )}
                      </div>
                      {!notification.is_read && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-3">
                      {notification.message.message}
                    </p>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatTimestamp(notification.created_at)}</span>
                      {notification.quote?.quote_number && (
                        <span className="flex items-center space-x-1">
                          <span>•</span>
                          <span className="font-medium">Quote {notification.quote.quote_number}</span>
                        </span>
                      )}
                      {notification.lineItem?.part_number && (
                        <span className="flex items-center space-x-1">
                          <span>•</span>
                          <span className="font-medium">Part {notification.lineItem.part_number}</span>
                        </span>
                      )}
                      {(notification.message.line_item_id && !notification.lineItem?.part_number) && (
                        <span className="flex items-center space-x-1">
                          <span>•</span>
                          <span>Line Item</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
