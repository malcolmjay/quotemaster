import { lazy, ComponentType } from 'react';
import {
  FileText,
  BarChart3,
  FolderOpen,
  BookOpen,
  Shield,
  DollarSign,
  Settings,
  Database,
  Edit3,
  Link2,
  GitBranch,
  Users,
  Building,
  Search,
  LucideIcon
} from 'lucide-react';

const QuoteBuilder = lazy(() => import('../components/quote/QuoteBuilder').then(m => ({ default: m.QuoteBuilder })));
const ProductCatalog = lazy(() => import('../components/catalog/ProductCatalog').then(m => ({ default: m.ProductCatalog })));
const CustomerProfile = lazy(() => import('../components/customer/CustomerProfile').then(m => ({ default: m.CustomerProfile })));
const QuoteManagement = lazy(() => import('../components/management/QuoteManagement').then(m => ({ default: m.QuoteManagement })));
const TrainingGuide = lazy(() => import('../components/training/TrainingGuide').then(m => ({ default: m.TrainingGuide })));
const PendingApprovals = lazy(() => import('../components/approval/PendingApprovals').then(m => ({ default: m.PendingApprovals })));
const PriceRequests = lazy(() => import('../components/management/PriceRequests').then(m => ({ default: m.PriceRequests })));
const ConfigurationSettings = lazy(() => import('../components/settings/ConfigurationSettings').then(m => ({ default: m.ConfigurationSettings })));
const ProductImport = lazy(() => import('../components/management/ProductImport').then(m => ({ default: m.ProductImport })));
const ProductManagement = lazy(() => import('../components/management/ProductManagement'));
const CrossReferenceManagement = lazy(() => import('../components/management/CrossReferenceManagement'));
const ItemRelationshipManagement = lazy(() => import('../components/management/ItemRelationshipManagement'));
const UserManagement = lazy(() => import('../components/management/UserManagement').then(m => ({ default: m.UserManagement })));
const CustomerManagement = lazy(() => import('../components/management/CustomerManagement').then(m => ({ default: m.CustomerManagement })));
const ItemInquiry = lazy(() => import('../components/inquiry/ItemInquiry').then(m => ({ default: m.ItemInquiry })));

export interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  help: string;
  component: ComponentType<any>;
  showInNav?: boolean;
}

export const TAB_CONFIG: readonly TabConfig[] = [
  {
    id: 'quote-builder',
    label: 'Quote Builder',
    icon: FileText,
    help: 'Create and build new quotes with line items, pricing, and customer details.',
    component: QuoteBuilder,
    showInNav: true
  },
  {
    id: 'pending-approvals',
    label: 'Pending Approvals',
    icon: Shield,
    help: 'Review and approve quotes that require management authorization.',
    component: PendingApprovals,
    showInNav: true
  },
  {
    id: 'price-requests',
    label: 'Price Requests',
    icon: DollarSign,
    help: 'Manage incoming price requests from customers and create quotes from them.',
    component: PriceRequests,
    showInNav: true
  },
  {
    id: 'item-inquiry',
    label: 'Item Inquiry',
    icon: Search,
    help: 'Search for products and check inventory levels, pricing, and availability.',
    component: ItemInquiry,
    showInNav: true
  },
  {
    id: 'customer-profile',
    label: 'Customer Profile',
    icon: BarChart3,
    help: 'View detailed customer information including purchase history and analytics.',
    component: CustomerProfile,
    showInNav: true
  },
  {
    id: 'customer-management',
    label: 'Customer Management',
    icon: Building,
    help: 'Add, edit, and manage customer records, addresses, and contacts.',
    component: CustomerManagement,
    showInNav: true
  },
  {
    id: 'quote-management',
    label: 'Quote Management',
    icon: FolderOpen,
    help: 'View, search, and manage all quotes in the system.',
    component: QuoteManagement,
    showInNav: true
  },
  {
    id: 'product-management',
    label: 'Product Management',
    icon: Edit3,
    help: 'Add, edit, and manage product catalog including SKUs, descriptions, and pricing.',
    component: ProductManagement,
    showInNav: true
  },
  {
    id: 'cross-reference-management',
    label: 'Cross Reference Management',
    icon: Link2,
    help: 'Manage product cross-references between customer part numbers and internal SKUs.',
    component: CrossReferenceManagement,
    showInNav: true
  },
  {
    id: 'item-relationships',
    label: 'Item Relationships',
    icon: GitBranch,
    help: 'Define relationships between products such as supersessions and alternatives.',
    component: ItemRelationshipManagement,
    showInNav: true
  },
  {
    id: 'product-import',
    label: 'Product Import',
    icon: Database,
    help: 'Bulk import products and cross-references from CSV files or external systems.',
    component: ProductImport,
    showInNav: true
  },
  {
    id: 'user-management',
    label: 'User Management',
    icon: Users,
    help: 'Manage user accounts, roles, and permissions for system access.',
    component: UserManagement,
    showInNav: true
  },
  {
    id: 'training-guide',
    label: 'Training Guide',
    icon: BookOpen,
    help: 'Learn how to use the system with step-by-step tutorials and documentation.',
    component: TrainingGuide,
    showInNav: true
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    help: 'Configure system settings including ERP integration, approval limits, and preferences.',
    component: ConfigurationSettings,
    showInNav: true
  },
  {
    id: 'product-catalog',
    label: 'Product Catalog',
    icon: Database,
    help: 'Browse the complete product catalog with search and filtering.',
    component: ProductCatalog,
    showInNav: false
  }
] as const;

export type TabId = typeof TAB_CONFIG[number]['id'];

export const VALID_TAB_IDS = TAB_CONFIG.map(tab => tab.id);

export const NAV_ITEMS = TAB_CONFIG.filter(tab => tab.showInNav !== false);

export function getTabConfig(id: string): TabConfig | undefined {
  return TAB_CONFIG.find(tab => tab.id === id);
}

export function isValidTabId(id: string): id is TabId {
  return VALID_TAB_IDS.includes(id);
}
