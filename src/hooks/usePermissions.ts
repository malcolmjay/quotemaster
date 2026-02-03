import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserPermission {
  table_name: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  show_in_navigation: boolean;
}

export interface PermissionCheck {
  hasPermission: (tableName: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
  getTablePermissions: (tableName: string) => UserPermission | undefined;
  isVisibleInNavigation: (tableName: string) => boolean;
  permissions: UserPermission[];
  loading: boolean;
  isAdmin: boolean;
}

export const usePermissions = (): PermissionCheck => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: adminCheck } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'Admin')
          .eq('is_active', true)
          .maybeSingle();

        setIsAdmin(!!adminCheck);

        const { data, error } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        const permissionMap = new Map<string, UserPermission>();
        data?.forEach(perm => {
          const existing = permissionMap.get(perm.table_name);
          if (existing) {
            permissionMap.set(perm.table_name, {
              table_name: perm.table_name,
              can_create: existing.can_create || perm.can_create,
              can_read: existing.can_read || perm.can_read,
              can_update: existing.can_update || perm.can_update,
              can_delete: existing.can_delete || perm.can_delete,
              show_in_navigation: existing.show_in_navigation || perm.show_in_navigation,
            });
          } else {
            permissionMap.set(perm.table_name, perm);
          }
        });

        setPermissions(Array.from(permissionMap.values()));
      } catch (error) {
        console.error('Error loading permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadPermissions();
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

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
