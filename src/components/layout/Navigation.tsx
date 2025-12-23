import React, { useState } from 'react';
import { FileText, BarChart3, FolderOpen, BookOpen, Menu, X, Shield, DollarSign, Settings, Database, Edit3, Link2, GitBranch, Users, Building, Search } from 'lucide-react';
import { ActiveTab } from '../../App';
import { HelpTooltip } from '../common/HelpTooltip';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'quote-builder', label: 'Quote Builder', icon: FileText, help: 'Create and build new quotes with line items, pricing, and customer details.' },
    { id: 'pending-approvals', label: 'Pending Approvals', icon: Shield, help: 'Review and approve quotes that require management authorization.' },
    { id: 'price-requests', label: 'Price Requests', icon: DollarSign, help: 'Manage incoming price requests from customers and create quotes from them.' },
    { id: 'item-inquiry', label: 'Item Inquiry', icon: Search, help: 'Search for products and check inventory levels, pricing, and availability.' },
    { id: 'customer-profile', label: 'Customer Profile', icon: BarChart3, help: 'View detailed customer information including purchase history and analytics.' },
    { id: 'customer-management', label: 'Customer Management', icon: Building, help: 'Add, edit, and manage customer records, addresses, and contacts.' },
    { id: 'quote-management', label: 'Quote Management', icon: FolderOpen, help: 'View, search, and manage all quotes in the system.' },
    { id: 'product-management', label: 'Product Management', icon: Edit3, help: 'Add, edit, and manage product catalog including SKUs, descriptions, and pricing.' },
    { id: 'cross-reference-management', label: 'Cross Reference Management', icon: Link2, help: 'Manage product cross-references between customer part numbers and internal SKUs.' },
    { id: 'item-relationships', label: 'Item Relationships', icon: GitBranch, help: 'Define relationships between products such as supersessions and alternatives.' },
    { id: 'product-import', label: 'Product Import', icon: Database, help: 'Bulk import products and cross-references from CSV files or external systems.' },
    { id: 'user-management', label: 'User Management', icon: Users, help: 'Manage user accounts, roles, and permissions for system access.' },
    { id: 'training-guide', label: 'Training Guide', icon: BookOpen, help: 'Learn how to use the system with step-by-step tutorials and documentation.' },
    { id: 'settings', label: 'Settings', icon: Settings, help: 'Configure system settings including ERP integration, approval limits, and preferences.' }
  ] as const;

  const handleTabChange = (tabId: ActiveTab) => {
    onTabChange(tabId);
    setIsOpen(false); // Close menu on mobile after selection
  };

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
            {navItems.map((item) => {
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
                      {item.count && (
                        <span className={`inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold rounded-full ${
                          isActive ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {item.count}
                        </span>
                      )}
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