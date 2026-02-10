import { useContext } from 'react';
import { PermissionsContext, UserPermission } from '../context/PermissionsContext';

export type { UserPermission };

export interface PermissionCheck {
  hasPermission: (tableName: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
  getTablePermissions: (tableName: string) => UserPermission | undefined;
  isVisibleInNavigation: (tableName: string) => boolean;
  permissions: UserPermission[];
  loading: boolean;
  isAdmin: boolean;
}

export const usePermissions = (): PermissionCheck => {
  const { permissions, loading, isAdmin } = useContext(PermissionsContext);

  const hasPermission = (tableName: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
    if (isAdmin) return true;

    const tablePermissions = permissions.find(p => p.table_name === tableName);
    if (!tablePermissions) return false;

    switch (action) {
      case 'create':
        return tablePermissions.can_create;
      case 'read':
        return tablePermissions.can_read;
      case 'update':
        return tablePermissions.can_update;
      case 'delete':
        return tablePermissions.can_delete;
      default:
        return false;
    }
  };

  const getTablePermissions = (tableName: string): UserPermission | undefined => {
    if (isAdmin) {
      return {
        table_name: tableName,
        can_create: true,
        can_read: true,
        can_update: true,
        can_delete: true,
        show_in_navigation: true,
      };
    }
    return permissions.find(p => p.table_name === tableName);
  };

  const isVisibleInNavigation = (tableName: string): boolean => {
    if (isAdmin) return true;
    const tablePermissions = permissions.find(p => p.table_name === tableName);
    return tablePermissions?.show_in_navigation ?? false;
  };

  return {
    hasPermission,
    getTablePermissions,
    isVisibleInNavigation,
    permissions,
    loading,
    isAdmin,
  };
};
