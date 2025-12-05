import React, { useState } from 'react';
import { X, UserCog, Shield } from 'lucide-react';

interface RoleAssignmentModalProps {
  user: {
    id: string;
    email: string;
    roles: Array<{
      role: string;
      is_active: boolean;
    }>;
  };
  onClose: () => void;
  onSave: (userId: string, roles: string[]) => Promise<void>;
}

const AVAILABLE_ROLES = [
  { value: 'Admin', label: 'Admin', description: 'Full system access' },
  { value: 'President', label: 'President', description: 'Approve all quotes' },
  { value: 'VP', label: 'VP', description: 'Approve quotes $200k+' },
  { value: 'Director', label: 'Director', description: 'Approve quotes $50k+' },
  { value: 'Manager', label: 'Manager', description: 'Approve quotes $25k+' },
  { value: 'CSR', label: 'CSR', description: 'Customer Service Rep' }
];

export const RoleAssignmentModal: React.FC<RoleAssignmentModalProps> = ({
  user,
  onClose,
  onSave
}) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    user.roles.filter(r => r.is_active).map(r => r.role)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(user.id, selectedRoles);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update roles');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCog className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage User Roles</h2>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {AVAILABLE_ROLES.map(role => (
              <div
                key={role.value}
                className={`
                  p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${selectedRoles.includes(role.value)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => toggleRole(role.value)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`
                    mt-1 w-5 h-5 rounded border-2 flex items-center justify-center
                    ${selectedRoles.includes(role.value)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedRoles.includes(role.value) && (
                      <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Shield className={`w-4 h-4 ${selectedRoles.includes(role.value) ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${selectedRoles.includes(role.value) ? 'text-blue-900' : 'text-gray-900'}`}>
                        {role.label}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${selectedRoles.includes(role.value) ? 'text-blue-700' : 'text-gray-600'}`}>
                      {role.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
