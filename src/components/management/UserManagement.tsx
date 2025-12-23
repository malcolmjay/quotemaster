import React, { useState, useEffect } from 'react';
import { Search, UserCog, Shield, Calendar, Mail, Clock, RefreshCw, AlertCircle, UserPlus, Edit, UserX, UserCheck, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { RoleAssignmentModal } from './RoleAssignmentModal';
import { HelpTooltip } from '../common/HelpTooltip';

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
      Admin: 'bg-[#9b59b6] text-white border-[#8e44ad]',
      President: 'bg-[#c0392b] text-white border-[#a93226]',
      VP: 'bg-[#e67e22] text-white border-[#d35400]',
      Director: 'bg-[#428bca] text-white border-[#3276b1]',
      Manager: 'bg-[#27ae60] text-white border-[#229954]',
      CSR: 'bg-[#95a5a6] text-white border-[#7f8c8d]'
    };
    return colors[role] || 'bg-[#95a5a6] text-white border-[#7f8c8d]';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-[#428bca] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Oro-style Header */}
      <div className="bg-white border-b border-[#d4d4d4] sticky top-0 z-40">
        <div className="px-5 py-3">
          {/* Breadcrumb */}
          <div className="text-xs text-[#999] mb-2">
            Administration / User Management
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-normal text-[#333]">User Management</h1>
              <p className="text-[#666] text-sm mt-1">Manage user accounts and role assignments</p>
            </div>
            <div className="flex items-center gap-2">
              <HelpTooltip content="Reload user data to see the latest account status and role assignments.">
                <button
                  onClick={fetchUsers}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </HelpTooltip>
              <HelpTooltip content="Add a new user account with email, password, and role assignments. Users receive a confirmation email.">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#428bca] hover:bg-[#3276b1] text-white text-sm font-medium rounded transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create User</span>
                </button>
              </HelpTooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-4">
        {error && (
          <div className="bg-[#f2dede] border border-[#ebccd1] rounded p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-[#a94442] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#a94442]">Error loading users</p>
              <p className="text-sm text-[#a94442] mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded border border-[#d4d4d4]">
        <div className="p-4 border-b border-[#d4d4d4]">
          <HelpTooltip content="Search users by email address to quickly find user accounts.">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#999] w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-transparent text-[#333]"
              />
            </div>
          </HelpTooltip>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#fafafa] border-b border-[#d4d4d4]">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#666] uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#666] uppercase tracking-wider">
                  Roles
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#666] uppercase tracking-wider">
                  Created
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#666] uppercase tracking-wider">
                  Last Sign In
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-[#666] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#d4d4d4]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[#666]">
                      <UserCog className="w-12 h-12 mb-3 text-[#999]" />
                      <p className="text-sm font-medium">No users found</p>
                      {searchTerm && (
                        <p className="text-xs text-[#999] mt-1">
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
                    <tr key={user.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#428bca] to-[#3276b1] rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {(user.display_name || user.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-[#333]">
                                {user.display_name || user.email.split('@')[0]}
                              </span>
                              {user.is_disabled && (
                                <span className="text-xs px-2 py-0.5 bg-[#f2dede] text-[#a94442] rounded-full font-medium border border-[#ebccd1]">
                                  Disabled
                                </span>
                              )}
                              {user.id === currentUser?.id && (
                                <span className="text-xs text-[#428bca] font-medium">
                                  (You)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Mail className="w-3 h-3 text-[#999]" />
                              <span className="text-xs text-[#666]">
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
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium border ${getRoleBadgeColor(roleData.role)}`}
                              >
                                <Shield className="w-3 h-3" />
                                <span>{roleData.role}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-[#666] italic">No roles assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-sm text-[#666]">
                          <Calendar className="w-4 h-4 text-[#999]" />
                          <span>{new Date(user.user_created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.last_sign_in_at ? (
                          <div className="flex items-center space-x-2 text-sm text-[#666]">
                            <Clock className="w-4 h-4 text-[#999]" />
                            <span>{new Date(user.last_sign_in_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-[#999] italic">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <HelpTooltip content="Update user display name and account information. Email addresses cannot be changed after creation.">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] text-sm rounded border border-transparent hover:border-[#d4d4d4] transition-colors"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </HelpTooltip>
                          <HelpTooltip content="Assign or remove user roles (CSR, Manager, Director, VP, President, Admin). Roles determine approval limits and system access.">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#428bca] hover:bg-[#3276b1] text-white text-sm rounded transition-colors"
                              title="Manage Roles"
                            >
                              <UserCog className="w-4 h-4" />
                            </button>
                          </HelpTooltip>
                          <HelpTooltip content="Enable or disable user access. Disabled users cannot log in but their data is preserved.">
                            <button
                              onClick={() => handleDisableUser(user)}
                              className={`inline-flex items-center space-x-1 px-3 py-1.5 text-sm rounded transition-colors ${
                                user.is_disabled
                                  ? 'bg-[#dff0d8] text-[#3c763d] hover:bg-[#d0e9c6] border border-[#d6e9c6]'
                                  : 'bg-[#f2dede] text-[#a94442] hover:bg-[#ebccd1] border border-[#ebccd1]'
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
                          </HelpTooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-[#d4d4d4] bg-[#fafafa]">
          <p className="text-sm text-[#666]">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
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
          <div className="bg-white rounded border border-[#d4d4d4] shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-[#d4d4d4] bg-[#fafafa]">
              <h2 className="text-lg font-medium text-[#333]">Create New User</h2>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-transparent text-[#333]"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-transparent text-[#333]"
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={createDisplayName}
                  onChange={(e) => setCreateDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-transparent text-[#333]"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333] mb-2">
                  User Roles
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-[#d4d4d4] rounded p-3">
                  {availableRoles.map((role) => (
                    <label key={role} className="flex items-center space-x-2 cursor-pointer hover:bg-[#f5f5f5] p-2 rounded">
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
                        className="w-4 h-4 text-[#428bca] border-[#d4d4d4] rounded focus:ring-[#428bca]"
                      />
                      <span className="text-sm text-[#333]">{role}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[#666] mt-1">
                  Select one or more roles for this user
                </p>
              </div>

              <div className="bg-[#d9edf7] border border-[#bce8f1] rounded p-3">
                <p className="text-sm text-[#31708f]">
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
                  className="px-4 py-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#428bca] hover:bg-[#3276b1] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded border border-[#d4d4d4] shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-[#d4d4d4] bg-[#fafafa] flex items-center justify-between">
              <h2 className="text-lg font-medium text-[#333]">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setError(null);
                }}
                className="text-[#999] hover:text-[#666]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-transparent text-[#333]"
                  placeholder="User's display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded bg-[#f5f5f5] text-[#999] cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-[#666] mt-1">
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
                  className="px-4 py-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#428bca] hover:bg-[#3276b1] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded border border-[#d4d4d4] shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-[#d4d4d4] bg-[#fafafa] flex items-center justify-between">
              <h2 className="text-lg font-medium text-[#333]">
                {disablingUser.is_disabled ? 'Enable User' : 'Disable User'}
              </h2>
              <button
                onClick={() => {
                  setShowDisableModal(false);
                  setDisablingUser(null);
                  setError(null);
                }}
                className="text-[#999] hover:text-[#666]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleToggleUserStatus} className="p-6 space-y-4">
              <div className="bg-[#fafafa] border border-[#d4d4d4] rounded p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#428bca] to-[#3276b1] rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {(disablingUser.display_name || disablingUser.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#333]">
                      {disablingUser.display_name || disablingUser.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-[#666]">{disablingUser.email}</p>
                  </div>
                </div>
              </div>

              {!disablingUser.is_disabled && (
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">
                    Reason for Disabling (Optional)
                  </label>
                  <textarea
                    value={disableReason}
                    onChange={(e) => setDisableReason(e.target.value)}
                    className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-transparent text-[#333]"
                    placeholder="Enter reason..."
                    rows={3}
                  />
                </div>
              )}

              <div className={`border rounded p-3 ${
                disablingUser.is_disabled ? 'bg-[#dff0d8] border-[#d6e9c6]' : 'bg-[#f2dede] border-[#ebccd1]'
              }`}>
                <p className={`text-sm ${
                  disablingUser.is_disabled ? 'text-[#3c763d]' : 'text-[#a94442]'
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
                  className="px-4 py-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition-colors"
                  disabled={disabling}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    disablingUser.is_disabled
                      ? 'bg-[#27ae60] hover:bg-[#229954]'
                      : 'bg-[#c0392b] hover:bg-[#a93226]'
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
