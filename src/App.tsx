import React, { useState, Suspense, lazy } from 'react';
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

const QuoteBuilder = lazy(() => import('./components/quote/QuoteBuilder').then(m => ({ default: m.QuoteBuilder })));
const ProductCatalog = lazy(() => import('./components/catalog/ProductCatalog').then(m => ({ default: m.ProductCatalog })));
const CrossReference = lazy(() => import('./components/reference/CrossReference').then(m => ({ default: m.CrossReference })));
const CustomerProfile = lazy(() => import('./components/customer/CustomerProfile').then(m => ({ default: m.CustomerProfile })));
const QuoteManagement = lazy(() => import('./components/management/QuoteManagement').then(m => ({ default: m.QuoteManagement })));
const TrainingGuide = lazy(() => import('./components/training/TrainingGuide').then(m => ({ default: m.TrainingGuide })));
const PendingApprovals = lazy(() => import('./components/approval/PendingApprovals').then(m => ({ default: m.PendingApprovals })));
const PriceRequests = lazy(() => import('./components/management/PriceRequests').then(m => ({ default: m.PriceRequests })));
const ConfigurationSettings = lazy(() => import('./components/settings/ConfigurationSettings').then(m => ({ default: m.ConfigurationSettings })));
const ProductImport = lazy(() => import('./components/management/ProductImport').then(m => ({ default: m.ProductImport })));
const ProductManagement = lazy(() => import('./components/management/ProductManagement'));
const CrossReferenceManagement = lazy(() => import('./components/management/CrossReferenceManagement'));
const ItemRelationshipManagement = lazy(() => import('./components/management/ItemRelationshipManagement'));
const UserManagement = lazy(() => import('./components/management/UserManagement').then(m => ({ default: m.UserManagement })));
const CustomerManagement = lazy(() => import('./components/management/CustomerManagement').then(m => ({ default: m.CustomerManagement })));
const ItemInquiry = lazy(() => import('./components/inquiry/ItemInquiry').then(m => ({ default: m.ItemInquiry })));

export type ActiveTab = 'quote-builder' | 'product-catalog' | 'cross-reference' | 'customer-profile' | 'customer-management' | 'quote-management' | 'training-guide' | 'pending-approvals' | 'price-requests' | 'settings' | 'product-import' | 'product-management' | 'cross-reference-management' | 'item-relationships' | 'user-management' | 'item-inquiry';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('quote-builder');

  // Listen for hash changes to handle navigation from other components
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const tabName = hash.split('?')[0];
      if (tabName && ['quote-builder', 'product-catalog', 'customer-profile', 'customer-management', 'quote-management', 'training-guide', 'pending-approvals', 'price-requests', 'settings', 'product-import', 'product-management', 'cross-reference-management', 'item-relationships', 'user-management', 'item-inquiry'].includes(tabName)) {
        setActiveTab(tabName as ActiveTab);
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

    return (
      <Suspense fallback={<LoadingFallback />}>
        {activeTab === 'quote-builder' && <QuoteBuilder />}
        {activeTab === 'product-catalog' && <ProductCatalog />}
        {activeTab === 'pending-approvals' && <PendingApprovals />}
        {activeTab === 'price-requests' && <PriceRequests />}
        {activeTab === 'customer-profile' && <CustomerProfile />}
        {activeTab === 'quote-management' && <QuoteManagement />}
        {activeTab === 'training-guide' && <TrainingGuide />}
        {activeTab === 'settings' && <ConfigurationSettings />}
        {activeTab === 'product-import' && <ProductImport />}
        {activeTab === 'product-management' && <ProductManagement />}
        {activeTab === 'cross-reference-management' && <CrossReferenceManagement />}
        {activeTab === 'item-relationships' && <ItemRelationshipManagement />}
        {activeTab === 'user-management' && <UserManagement />}
        {activeTab === 'customer-management' && <CustomerManagement />}
        {activeTab === 'item-inquiry' && <ItemInquiry />}
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