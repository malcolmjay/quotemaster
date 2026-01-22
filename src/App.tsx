import React, { useState, Suspense } from 'react';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { HelpProvider } from './context/HelpContext';
import { SupabaseQuoteProvider } from './context/SupabaseQuoteContext';
import { QuoteProvider } from './context/QuoteContext';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { CustomerProvider } from './context/CustomerContext';
import { InventoryProvider } from './context/InventoryContext';
import { TabId, getTabConfig, isValidTabId } from './config/tabs';

export type ActiveTab = TabId;

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('quote-builder');

  // Listen for hash changes to handle navigation from other components
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const tabName = hash.split('?')[0];
      if (tabName && isValidTabId(tabName)) {
        setActiveTab(tabName);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderActiveTab = () => {
    const LoadingFallback = () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );

    const tabConfig = getTabConfig(activeTab);
    if (!tabConfig) {
      return <div className="text-center p-8 text-gray-500">Tab not found</div>;
    }

    const Component = tabConfig.component;

    return (
      <Suspense fallback={<LoadingFallback />}>
        <Component />
      </Suspense>
    );
  };

  return (
    <ThemeProvider>
      <HelpProvider>
        <AuthProvider>
          <ProtectedRoute>
            <SupabaseQuoteProvider>
              <QuoteProvider>
                <CustomerProvider>
                  <InventoryProvider>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
                      <Header />
                      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
                      <main className="p-3 pt-20">
                        {renderActiveTab()}
                      </main>
                    </div>
                  </InventoryProvider>
                </CustomerProvider>
              </QuoteProvider>
            </SupabaseQuoteProvider>
          </ProtectedRoute>
        </AuthProvider>
      </HelpProvider>
    </ThemeProvider>
  );
}

export default App;