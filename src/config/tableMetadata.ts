export interface TableMetadata {
  name: string;
  displayName: string;
  description: string;
  category: 'core' | 'management' | 'system' | 'communication';
}

export const TABLE_METADATA: TableMetadata[] = [
  {
    name: 'quotes',
    displayName: 'Quotes',
    description: 'Customer quotes and bid information including pricing, terms, and approval status',
    category: 'core',
  },
  {
    name: 'quote_line_items',
    displayName: 'Quote Line Items',
    description: 'Individual items and products within each quote with quantities, pricing, and costs',
    category: 'core',
  },
  {
    name: 'customers',
    displayName: 'Customers',
    description: 'Customer company information including contact details, sales assignments, and account status',
    category: 'core',
  },
  {
    name: 'customer_addresses',
    displayName: 'Customer Addresses',
    description: 'Shipping and billing addresses for customer locations and warehouses',
    category: 'core',
  },
  {
    name: 'customer_contacts',
    displayName: 'Customer Contacts',
    description: 'Individual contact persons at customer companies with their roles and contact information',
    category: 'core',
  },
  {
    name: 'products',
    displayName: 'Products',
    description: 'Product catalog including SKUs, descriptions, pricing, and supplier information',
    category: 'management',
  },
  {
    name: 'cross_references',
    displayName: 'Cross References',
    description: 'Product cross-reference mappings between customer part numbers and internal SKUs',
    category: 'management',
  },
  {
    name: 'item_relationships',
    displayName: 'Item Relationships',
    description: 'Product supersessions and replacements showing which items replace discontinued parts',
    category: 'management',
  },
  {
    name: 'price_requests',
    displayName: 'Price Requests',
    description: 'Requests sent to suppliers for product pricing and cost information',
    category: 'management',
  },
  {
    name: 'approval_actions',
    displayName: 'Approval Actions',
    description: 'Quote approval workflow tracking approvals, rejections, and comments from management',
    category: 'core',
  },
  {
    name: 'user_roles',
    displayName: 'User Role Assignments',
    description: 'Assignment of roles to users defining their access level and permissions',
    category: 'system',
  },
  {
    name: 'roles',
    displayName: 'Roles',
    description: 'Role definitions including system and custom roles with their descriptions',
    category: 'system',
  },
  {
    name: 'role_permissions',
    displayName: 'Role Permissions',
    description: 'Granular CRUD permissions defining what each role can do in the system',
    category: 'system',
  },
  {
    name: 'app_configurations',
    displayName: 'App Configurations',
    description: 'System-wide configuration settings including API endpoints and integration parameters',
    category: 'system',
  },
  {
    name: 'tasks',
    displayName: 'Tasks',
    description: 'Task management for quotes including action items, assignments, and due dates',
    category: 'communication',
  },
  {
    name: 'messages',
    displayName: 'Messages',
    description: 'Internal messages and notes attached to quotes and line items for team collaboration',
    category: 'communication',
  },
  {
    name: 'notifications',
    displayName: 'Notifications',
    description: 'System notifications for users about approvals, updates, and important events',
    category: 'communication',
  },
  {
    name: 'ai_conversations',
    displayName: 'AI Conversations',
    description: 'AI agent chat history and data queries for natural language database interactions',
    category: 'system',
  },
];

export const getCategoryColor = (category: TableMetadata['category']): string => {
  switch (category) {
    case 'core':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'management':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'system':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'communication':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const getCategoryName = (category: TableMetadata['category']): string => {
  switch (category) {
    case 'core':
      return 'Core Business';
    case 'management':
      return 'Data Management';
    case 'system':
      return 'System & Security';
    case 'communication':
      return 'Communication';
    default:
      return 'Other';
  }
};

export const getTableMetadata = (tableName: string): TableMetadata | undefined => {
  return TABLE_METADATA.find(t => t.name === tableName);
};
