import React, { useState, useEffect } from 'react';
import { Search, UserCog, Shield, Calendar, Mail, Clock, RefreshCw, AlertCircle, UserPlus, Edit, UserX, UserCheck, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { RoleAssignmentModal } from './RoleAssignmentModal';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  user_created_at: string;
  last_sign_in_at: string | null;
  is_disabled: boolean;
  disabled_at: string | null;
  disabled_by: string | null;
  disabled_reason: string | null;
  roles: Array<{
    role: string;
    assigned_at: string;
    is_active: boolean;
  }>;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablingUser, setDisablingUser] = useState<UserProfile | null>(null);
  const [disableReason, setDisableReason] = useState('');
  const [disabling, setDisabling] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRoles, setCreateRoles] = useState<string[]>([]);
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [creating, setCreating] = useState(false);

  const availableRoles = ['CSR', 'Manager', 'Director', 'VP', 'President', 'Admin'];
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the secure function instead of querying the view directly
      const { data, error: fetchError } = await supabase
        .rpc('get_all_user_profiles');

      if (fetchError) throw fetchError;

      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createEmail || !createPassword) {
      setError('Email and password are required');
      return;
    }

    if (createPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to create users');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: createEmail,
          password: createPassword,
          email_confirm: true,
          roles: createRoles,
          display_name: createDisplayName || createEmail.split('@')[0]
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create user');
      }

      setShowCreateModal(false);
      setCreateEmail('');
      setCreatePassword('');
      setCreateRoles([]);
      setCreateDisplayName('');
      await fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRoles = async (userId: string, newRoles: string[]) => {
    try {
      const { data: existingRoles, error: fetchError } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;

      const existingRoleNames = existingRoles?.map(r => r.role) || [];
      const rolesToAdd = newRoles.filter(r => !existingRoleNames.includes(r));
      const rolesToRemove = existingRoleNames.filter(r => !newRoles.includes(r));

      if (rolesToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(
            rolesToAdd.map(role => ({
              user_id: userId,
              role,
              assigned_by: currentUser?.id,
              is_active: true
            }))
          );

        if (insertError) throw insertError;
      }

      if (rolesToRemove.length > 0) {
        const roleIdsToRemove = existingRoles
          ?.filter(r => rolesToRemove.includes(r.role))
          .map(r => r.id) || [];

        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .in('id', roleIdsToRemove);

        if (deleteError) throw deleteError;
      }

      await fetchUsers();
    } catch (err) {
      console.error('Error updating roles:', err);
      throw err;
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditDisplayName(user.display_name || '');
    setEditEmail(user.email);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    try {
      setUpdating(true);
      setError(null);

      const { data: existingMetadata, error: fetchError } = await supabase
        .from('user_metadata')
        .select('*')
        .eq('user_id', editingUser.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingMetadata) {
        const { error: updateError } = await supabase
          .from('user_metadata')
          .update({
            display_name: editDisplayName || null
          })
          .eq('user_id', editingUser.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_metadata')
          .insert({
            user_id: editingUser.id,
            display_name: editDisplayName || null
          });

        if (insertError) throw insertError;
      }

      setShowEditModal(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  const handleDisableUser = (user: UserProfile) => {
    setDisablingUser(user);
    setDisableReason('');
    setShowDisableModal(true);
  };

  const handleToggleUserStatus = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!disablingUser) return;

    try {
      setDisabling(true);
      setError(null);

      const { data: existingMetadata, error: fetchError } = await supabase
        .from('user_metadata')
        .select('*')
        .eq('user_id', disablingUser.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const newStatus = !disablingUser.is_disabled;

      if (existingMetadata) {
        const { error: updateError } = await supabase
          .from('user_metadata')
          .update({
            is_disabled: newStatus,
            disabled_at: newStatus ? new Date().toISOString() : null,
            disabled_by: newStatus ? currentUser?.id : null,
            disabled_reason: newStatus ? disableReason : null
          })
          .eq('user_id', disablingUser.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_metadata')
          .insert({
            user_id: disablingUser.id,
            is_disabled: newStatus,
            disabled_at: newStatus ? new Date().toISOString() : null,
            disabled_by: newStatus ? currentUser?.id : null,
            disabled_reason: newStatus ? disableReason : null
          });

        if (insertError) throw insertError;
      }

      setShowDisableModal(false);
      setDisablingUser(null);
      await fetchUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setDisabling(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      Admin: 'bg-purple-100 text-purple-800 border-purple-200',
      President: 'bg-red-100 text-red-800 border-red-200',
      VP: 'bg-orange-100 text-orange-800 border-orange-200',
      Director: 'bg-blue-100 text-blue-800 border-blue-200',
      Manager: 'bg-green-100 text-green-800 border-green-200',
      CSR: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and role assignments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </button>
          <button
            onClick={fetchUsers}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error loading users</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Sign In
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <UserCog className="w-12 h-12 mb-3 text-gray-400" />
                      <p className="text-sm font-medium">No users found</p>
                      {searchTerm && (
                        <p className="text-xs text-gray-400 mt-1">
                          Try adjusting your search
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const activeRoles = user.roles.filter(r => r.is_active);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {(user.display_name || user.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {user.display_name || user.email.split('@')[0]}
                              </span>
                              {user.is_disabled && (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                  Disabled
                                </span>
                              )}
                              {user.id === currentUser?.id && (
                                <span className="text-xs text-blue-600 font-medium">
                                  (You)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {activeRoles.length > 0 ? (
                            activeRoles.map((roleData, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium border ${getRoleBadgeColor(roleData.role)}`}
                              >
                                <Shield className="w-3 h-3" />
                                <span>{roleData.role}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 italic">No roles assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(user.user_created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.last_sign_in_at ? (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{new Date(user.last_sign_in_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            title="Manage Roles"
                          >
                            <UserCog className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDisableUser(user)}
                            className={`inline-flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              user.is_disabled
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                            title={user.is_disabled ? 'Enable User' : 'Disable User'}
                            disabled={user.id === currentUser?.id}
                          >
                            {user.is_disabled ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </div>

      {selectedUser && (
        <RoleAssignmentModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={handleUpdateRoles}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={createDisplayName}
                  onChange={(e) => setCreateDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Roles
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {availableRoles.map((role) => (
                    <label key={role} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={createRoles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateRoles([...createRoles, role]);
                          } else {
                            setCreateRoles(createRoles.filter(r => r !== role));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{role}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select one or more roles for this user
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  The user will receive a confirmation email and can log in immediately with the assigned roles.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateEmail('');
                    setCreatePassword('');
                    setCreateRoles([]);
                    setCreateDisplayName('');
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="User's display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed after user creation
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDisableModal && disablingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {disablingUser.is_disabled ? 'Enable User' : 'Disable User'}
              </h2>
              <button
                onClick={() => {
                  setShowDisableModal(false);
                  setDisablingUser(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleToggleUserStatus} className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {(disablingUser.display_name || disablingUser.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {disablingUser.display_name || disablingUser.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-600">{disablingUser.email}</p>
                  </div>
                </div>
              </div>

              {!disablingUser.is_disabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Disabling (Optional)
                  </label>
                  <textarea
                    value={disableReason}
                    onChange={(e) => setDisableReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter reason..."
                    rows={3}
                  />
                </div>
              )}

              <div className={`border rounded-lg p-3 ${
                disablingUser.is_disabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm ${
                  disablingUser.is_disabled ? 'text-green-800' : 'text-red-800'
                }`}>
                  {disablingUser.is_disabled
                    ? 'This will enable the user account and allow them to sign in.'
                    : 'This will disable the user account and prevent them from signing in. Their data will be preserved.'}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDisableModal(false);
                    setDisablingUser(null);
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={disabling}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    disablingUser.is_disabled
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  disabled={disabling}
                >
                  {disabling
                    ? disablingUser.is_disabled ? 'Enabling...' : 'Disabling...'
                    : disablingUser.is_disabled ? 'Enable User' : 'Disable User'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
