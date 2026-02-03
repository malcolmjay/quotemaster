import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Save, X, AlertCircle, Check, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TABLE_METADATA, getCategoryColor, getCategoryName, type TableMetadata } from '../../config/tableMetadata';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
}

interface RolePermission {
  id: string;
  role_id: string;
  table_name: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; role: Role | null }>({
    isOpen: false,
    role: null,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  const [permissionChanges, setPermissionChanges] = useState<Map<string, Partial<RolePermission>>>(
    new Map()
  );

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadPermissions(selectedRole.id);
    }
  }, [selectedRole]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);

      if (data && data.length > 0 && !selectedRole) {
        setSelectedRole(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async (roleId: string) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', roleId);

      if (error) throw error;
      setPermissions(data || []);
      setPermissionChanges(new Map());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditForm({
      name: '',
      description: '',
      is_active: true,
    });
  };

  const startEditing = () => {
    if (!selectedRole) return;
    setIsEditing(true);
    setIsCreating(false);
    setEditForm({
      name: selectedRole.name,
      description: selectedRole.description || '',
      is_active: selectedRole.is_active,
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditForm({
      name: '',
      description: '',
      is_active: true,
    });
  };

  const saveRole = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!editForm.name.trim()) {
        setError('Role name is required');
        return;
      }

      if (isCreating) {
        const { data, error } = await supabase
          .from('roles')
          .insert({
            name: editForm.name.trim(),
            description: editForm.description.trim() || null,
            is_active: editForm.is_active,
            is_system_role: false,
          })
          .select()
          .single();

        if (error) throw error;

        await loadRoles();
        setSelectedRole(data);
        setIsCreating(false);
      } else if (isEditing && selectedRole) {
        const { error } = await supabase
          .from('roles')
          .update({
            name: editForm.name.trim(),
            description: editForm.description.trim() || null,
            is_active: editForm.is_active,
          })
          .eq('id', selectedRole.id);

        if (error) throw error;

        await loadRoles();
        setIsEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role: Role) => {
    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase.from('roles').delete().eq('id', role.id);

      if (error) throw error;

      await loadRoles();
      if (selectedRole?.id === role.id) {
        setSelectedRole(roles[0] || null);
      }
      setDeleteModal({ isOpen: false, role: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      setSaving(false);
    }
  };

  const updatePermission = (
    tableName: string,
    field: 'can_create' | 'can_read' | 'can_update' | 'can_delete',
    value: boolean
  ) => {
    const existing = permissions.find((p) => p.table_name === tableName);
    const current = permissionChanges.get(tableName) || existing || {
      table_name: tableName,
      role_id: selectedRole!.id,
      can_create: false,
      can_read: false,
      can_update: false,
      can_delete: false,
    };

    const updated = { ...current, [field]: value };
    const newChanges = new Map(permissionChanges);
    newChanges.set(tableName, updated);
    setPermissionChanges(newChanges);
  };

  const savePermissions = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      setError(null);

      for (const [tableName, changes] of permissionChanges.entries()) {
        const existing = permissions.find((p) => p.table_name === tableName);

        if (existing) {
          const { error } = await supabase
            .from('role_permissions')
            .update(changes)
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from('role_permissions').insert({
            role_id: selectedRole.id,
            table_name: tableName,
            can_create: (changes as RolePermission).can_create,
            can_read: (changes as RolePermission).can_read,
            can_update: (changes as RolePermission).can_update,
            can_delete: (changes as RolePermission).can_delete,
          });

          if (error) throw error;
        }
      }

      await loadPermissions(selectedRole.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const getPermissionValue = (
    tableName: string,
    field: 'can_create' | 'can_read' | 'can_update' | 'can_delete'
  ): boolean => {
    const changes = permissionChanges.get(tableName);
    if (changes && field in changes) {
      return changes[field] as boolean;
    }

    const existing = permissions.find((p) => p.table_name === tableName);
    return existing?.[field] || false;
  };

  const hasUnsavedChanges = permissionChanges.size > 0;

  const groupedTables = TABLE_METADATA.reduce((acc, table) => {
    if (!acc[table.category]) {
      acc[table.category] = [];
    }
    acc[table.category].push(table);
    return acc;
  }, {} as Record<string, TableMetadata[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
              <p className="text-sm text-gray-600">
                Configure roles and their permissions for system access control
              </p>
            </div>
          </div>
          <button
            onClick={startCreating}
            disabled={isCreating || isEditing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Roles ({roles.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  if (!isCreating && !isEditing) {
                    setSelectedRole(role);
                  }
                }}
                disabled={isCreating || isEditing}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed ${
                  selectedRole?.id === role.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900 truncate">{role.name}</p>
                      {role.is_system_role && (
                        <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    {role.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {role.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-2">
                    {role.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(isCreating || isEditing) && (
            <div className="bg-white border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isCreating ? 'Create New Role' : 'Edit Role'}
              </h2>

              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="e.g., Sales Manager"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Describe the purpose and responsibilities of this role"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Role is active
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={saveRole}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Role'}</span>
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedRole && !isCreating && !isEditing && (
            <div className="p-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-xl font-semibold text-gray-900">{selectedRole.name}</h2>
                      {selectedRole.is_system_role && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Lock className="w-3 h-3 mr-1" />
                          System Role
                        </span>
                      )}
                    </div>
                    {selectedRole.description && (
                      <p className="text-gray-600 mt-2">{selectedRole.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={startEditing}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit role"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    {!selectedRole.is_system_role && (
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, role: selectedRole })}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete role"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure what this role can do in each part of the system
                      </p>
                    </div>
                    {hasUnsavedChanges && (
                      <button
                        onClick={savePermissions}
                        disabled={saving}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {Object.entries(groupedTables).map(([category, tables]) => (
                    <div key={category} className="mb-8 last:mb-0">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                        {getCategoryName(category as TableMetadata['category'])}
                      </h4>

                      <div className="space-y-3">
                        {tables.map((table) => (
                          <div
                            key={table.name}
                            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-medium text-gray-900">
                                    {table.displayName}
                                  </h5>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(
                                      table.category
                                    )}`}
                                  >
                                    {table.name}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{table.description}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                              {['can_create', 'can_read', 'can_update', 'can_delete'].map(
                                (perm) => (
                                  <label
                                    key={perm}
                                    className="flex items-center space-x-2 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={getPermissionValue(
                                        table.name,
                                        perm as 'can_create' | 'can_read' | 'can_update' | 'can_delete'
                                      )}
                                      onChange={(e) =>
                                        updatePermission(
                                          table.name,
                                          perm as 'can_create' | 'can_read' | 'can_update' | 'can_delete',
                                          e.target.checked
                                        )
                                      }
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-700 capitalize">
                                      {perm.replace('can_', '')}
                                    </span>
                                  </label>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!selectedRole && !isCreating && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No roles available. Create one to get started.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteModal.isOpen && deleteModal.role && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, role: null })}
          onConfirm={() => deleteRole(deleteModal.role!)}
          title="Delete Role"
          message="Are you sure you want to delete this role? This action cannot be undone."
          itemName={deleteModal.role.name}
          deleteType="hard"
          loading={saving}
          cascadeWarning="Deleting this role will also remove all permission configurations associated with it."
        />
      )}
    </div>
  );
};

export default RoleManagement;
