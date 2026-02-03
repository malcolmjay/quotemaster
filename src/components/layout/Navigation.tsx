import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ActiveTab } from '../../App';
import { HelpTooltip } from '../common/HelpTooltip';
import { NAV_ITEMS } from '../../config/tabs';
import { usePermissions } from '../../hooks/usePermissions';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isVisibleInNavigation, isAdmin, loading } = usePermissions();

  const handleTabChange = (tabId: ActiveTab) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (!item.table) return true;
    return isVisibleInNavigation(item.table);
  });

  if (loading) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Menu */}
      <nav className={`
        fixed top-0 left-0 h-full w-64
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-3 pt-16">
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id}>
                  <HelpTooltip content={item.help}>
                    <button
                      onClick={() => handleTabChange(item.id as ActiveTab)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-md transition-all duration-200 text-sm ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                    </button>
                  </HelpTooltip>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
};