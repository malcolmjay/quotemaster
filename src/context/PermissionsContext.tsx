import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UserPermission {
  table_name: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  show_in_navigation: boolean;
}

export interface PermissionsContextValue {
  permissions: UserPermission[];
  loading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

export const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: [],
  loading: true,
  isAdmin: false,
  refresh: async () => {},
});

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPermissions([]);
        setIsAdmin(false);
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
  }, []);

  useEffect(() => {
    loadPermissions();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadPermissions();
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [loadPermissions]);

  return (
    <PermissionsContext.Provider value={{ permissions, loading, isAdmin, refresh: loadPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
};
