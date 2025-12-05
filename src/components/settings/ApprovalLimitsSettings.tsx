import React, { useState, useEffect } from 'react';
import { Shield, Save, RefreshCw, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RoleLimit {
  id: string;
  role: string;
  min_amount: number;
  max_amount: number;
}

export const ApprovalLimitsSettings: React.FC = () => {
  const [limits, setLimits] = useState<RoleLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const roleOrder = ['CSR', 'Manager', 'Director', 'VP', 'President', 'Admin'];

  const fetchLimits = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('role_approval_limits')
        .select('*')
        .order('min_amount', { ascending: true });

      if (fetchError) throw fetchError;

      const sortedData = (data || []).sort((a, b) => {
        return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
      });

      setLimits(sortedData);
    } catch (err) {
      console.error('Error fetching approval limits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch approval limits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const handleLimitChange = (id: string, field: 'min_amount' | 'max_amount', value: string) => {
    const numValue = parseFloat(value) || 0;
    setLimits(prev =>
      prev.map(limit =>
        limit.id === id ? { ...limit, [field]: numValue } : limit
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      for (const limit of limits) {
        if (limit.min_amount < 0) {
          throw new Error(`Minimum amount for ${limit.role} cannot be negative`);
        }
        if (limit.max_amount < limit.min_amount) {
          throw new Error(`Maximum amount for ${limit.role} must be greater than or equal to minimum amount`);
        }
      }

      for (const limit of limits) {
        const { error: updateError } = await supabase
          .from('role_approval_limits')
          .update({
            min_amount: limit.min_amount,
            max_amount: limit.max_amount
          })
          .eq('id', limit.id);

        if (updateError) throw updateError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await fetchLimits();
    } catch (err) {
      console.error('Error saving approval limits:', err);
      setError(err instanceof Error ? err.message : 'Failed to save approval limits');
    } finally {
      setSaving(false);
    }
  };

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
          <h2 className="text-xl font-semibold text-gray-900">Role Approval Limits</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure minimum and maximum approval amounts for each role
          </p>
        </div>
        <button
          onClick={fetchLimits}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Success</p>
            <p className="text-sm text-green-600 mt-1">Approval limits updated successfully</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Minimum Amount
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maximum Amount
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Range
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {limits.map((limit) => (
                <tr key={limit.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getRoleBadgeColor(limit.role)}`}>
                        {limit.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        value={limit.min_amount}
                        onChange={(e) => handleLimitChange(limit.id, 'min_amount', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        value={limit.max_amount}
                        onChange={(e) => handleLimitChange(limit.id, 'max_amount', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700 font-medium">
                      {formatCurrency(limit.min_amount)} - {formatCurrency(limit.max_amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Configure approval authority ranges for each role level
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Approval Limits</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Users with a specific role can approve quotes within their assigned range</li>
          <li>Minimum amount is the lowest quote value a role can approve</li>
          <li>Maximum amount is the highest quote value a role can approve</li>
          <li>Ensure ranges don't overlap to maintain clear approval hierarchy</li>
        </ul>
      </div>
    </div>
  );
};
