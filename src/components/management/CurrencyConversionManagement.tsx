import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Search, Plus, Pencil, Trash2, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Pagination } from '../common/Pagination';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

interface CurrencyConversion {
  id: string;
  from_currency: string;
  to_currency: string;
  spot_rate: number;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversionForm {
  from_currency: string;
  to_currency: string;
  spot_rate: string;
  effective_from: string;
  effective_to: string;
}

const FROM_CURRENCIES = ['CAD', 'EUR', 'GBP', 'USD', 'CNH'];
const TO_CURRENCIES = ['USD', 'CAD'];

const EMPTY_FORM: ConversionForm = {
  from_currency: 'EUR',
  to_currency: 'USD',
  spot_rate: '',
  effective_from: new Date().toISOString().split('T')[0],
  effective_to: '',
};

export const CurrencyConversionManagement: React.FC = () => {
  const [conversions, setConversions] = useState<CurrencyConversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ConversionForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CurrencyConversion | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  const { showToast } = useToast();

  useEffect(() => {
    fetchConversions();
  }, []);

  const fetchConversions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('currency_conversions')
        .select('*')
        .order('from_currency')
        .order('to_currency')
        .order('effective_from', { ascending: false });

      if (error) throw error;
      setConversions(data || []);
    } catch (error) {
      showToast('error', 'Failed to load currency conversions', 'Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredConversions = conversions.filter(c => {
    if (filterFrom && c.from_currency !== filterFrom) return false;
    if (filterTo && c.to_currency !== filterTo) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        c.from_currency.toLowerCase().includes(term) ||
        c.to_currency.toLowerCase().includes(term) ||
        String(c.spot_rate).includes(term)
      );
    }
    return true;
  });

  const paginatedConversions = filteredConversions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const isRateActive = (conv: CurrencyConversion) => {
    const today = new Date().toISOString().split('T')[0];
    if (conv.effective_from > today) return false;
    if (conv.effective_to && conv.effective_to < today) return false;
    return true;
  };

  const isRateExpired = (conv: CurrencyConversion) => {
    if (!conv.effective_to) return false;
    const today = new Date().toISOString().split('T')[0];
    return conv.effective_to < today;
  };

  const handleAdd = async () => {
    if (!formData.spot_rate || parseFloat(formData.spot_rate) <= 0) {
      showToast('warning', 'Invalid rate', 'Spot rate must be greater than zero.');
      return;
    }
    if (!formData.effective_from) {
      showToast('warning', 'Missing date', 'Effective from date is required.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('currency_conversions')
        .insert({
          from_currency: formData.from_currency,
          to_currency: formData.to_currency,
          spot_rate: parseFloat(formData.spot_rate),
          effective_from: formData.effective_from,
          effective_to: formData.effective_to || null,
        });

      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          showToast('warning', 'Duplicate entry', 'A conversion with this currency pair and effective date already exists.');
        } else {
          throw error;
        }
        return;
      }

      setFormData(EMPTY_FORM);
      setShowAddForm(false);
      showToast('success', 'Rate added', `${formData.from_currency} to ${formData.to_currency} conversion rate saved.`);
      await fetchConversions();
    } catch (error) {
      showToast('error', 'Failed to add rate', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (conv: CurrencyConversion) => {
    setEditingId(conv.id);
    setFormData({
      from_currency: conv.from_currency,
      to_currency: conv.to_currency,
      spot_rate: String(conv.spot_rate),
      effective_from: conv.effective_from,
      effective_to: conv.effective_to || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!formData.spot_rate || parseFloat(formData.spot_rate) <= 0) {
      showToast('warning', 'Invalid rate', 'Spot rate must be greater than zero.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('currency_conversions')
        .update({
          from_currency: formData.from_currency,
          to_currency: formData.to_currency,
          spot_rate: parseFloat(formData.spot_rate),
          effective_from: formData.effective_from,
          effective_to: formData.effective_to || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) throw error;

      setEditingId(null);
      setFormData(EMPTY_FORM);
      showToast('success', 'Rate updated', 'Currency conversion rate has been updated.');
      await fetchConversions();
    } catch (error) {
      showToast('error', 'Failed to update rate', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('currency_conversions')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      showToast('success', 'Rate deleted', `${deleteTarget.from_currency} to ${deleteTarget.to_currency} rate removed.`);
      setDeleteTarget(null);
      await fetchConversions();
    } catch (error) {
      showToast('error', 'Failed to delete rate', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const hasActiveFilters = filterFrom || filterTo || searchTerm;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#e5e7eb] dark:border-slate-700 shadow-sm">
        <div className="px-6 py-4 border-b border-[#e5e7eb] dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#1a6fb5]/10 flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-[#1a6fb5]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1a1f36] dark:text-white">Currency Conversions</h2>
                <p className="text-xs text-[#5f6672] dark:text-slate-400">
                  Manage exchange rates for converting supplier currencies to customer currencies
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#5f6672] dark:text-slate-400 bg-[#f4f5f7] dark:bg-slate-700 px-2.5 py-1 rounded-full">
                {filteredConversions.length} {filteredConversions.length === 1 ? 'rate' : 'rates'}
              </span>
              <button
                onClick={() => { setShowAddForm(true); setFormData(EMPTY_FORM); setEditingId(null); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1a6fb5] text-white text-sm font-medium rounded-md hover:bg-[#155a94] shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Rate
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-[#e5e7eb] dark:border-slate-700 bg-[#f8f9fb] dark:bg-slate-800/50">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search rates..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-[#dce0e6] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white placeholder-[#999] focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5]"
              />
            </div>
            <select
              value={filterFrom}
              onChange={(e) => { setFilterFrom(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 bg-white dark:bg-slate-700 border border-[#dce0e6] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5]"
            >
              <option value="">All From</option>
              {FROM_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterTo}
              onChange={(e) => { setFilterTo(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 bg-white dark:bg-slate-700 border border-[#dce0e6] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5]"
            >
              <option value="">All To</option>
              {TO_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {hasActiveFilters && (
              <button
                onClick={() => { setSearchTerm(''); setFilterFrom(''); setFilterTo(''); setCurrentPage(1); }}
                className="text-xs text-[#1a6fb5] hover:text-[#155a94] font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {showAddForm && !editingId && (
          <div className="px-6 py-4 border-b border-[#e5e7eb] dark:border-slate-700 bg-[#eef6fc] dark:bg-slate-700/40">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="h-4 w-4 text-[#1a6fb5]" />
              <span className="text-sm font-medium text-[#1a1f36] dark:text-white">New Conversion Rate</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">From Currency</label>
                <select
                  value={formData.from_currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, from_currency: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-[#dce0e6] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5]"
                >
                  {FROM_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">To Currency</label>
                <select
                  value={formData.to_currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, to_currency: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-[#dce0e6] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5]"
                >
                  {TO_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">Spot Rate</label>
                <input
                  type="number"
                  step="0.00000001"
                  min="0"
                  value={formData.spot_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, spot_rate: e.target.value }))}
                  placeholder="0.00000000"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-[#dce0e6] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white placeholder-[#999] focus:ring-2 focus:ring-[#1a6fb5]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">Effective From</label>
                <input
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) => setFormData(prev => ({ ...prev, effective_from: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-[#dce0e6] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">Effective To</label>
                <input
                  type="date"
                  value={formData.effective_to}
                  onChange={(e) => setFormData(prev => ({ ...prev, effective_to: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-[#dce0e6] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleAdd}
                disabled={saving || !formData.spot_rate || !formData.effective_from}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1a6fb5] text-white text-sm rounded-md hover:bg-[#155a94] disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </button>
              <button
                onClick={() => { setShowAddForm(false); setFormData(EMPTY_FORM); }}
                className="px-3 py-2 text-sm text-[#5f6672] hover:bg-[#e8e8e8] dark:hover:bg-slate-600 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-[#1a6fb5] animate-spin" />
            </div>
          ) : paginatedConversions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ArrowRightLeft className="h-10 w-10 text-[#cdd1d9] mb-3" />
              <p className="text-sm text-[#5f6672]">
                {hasActiveFilters ? 'No rates match your filters' : 'No conversion rates added yet'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5e7eb] dark:border-slate-700 bg-[#f8f9fb] dark:bg-slate-800/80">
                  <th className="text-left text-xs font-medium text-[#5f6672] dark:text-slate-400 uppercase tracking-wider px-6 py-3">From</th>
                  <th className="text-center text-xs font-medium text-[#5f6672] dark:text-slate-400 uppercase tracking-wider px-2 py-3"></th>
                  <th className="text-left text-xs font-medium text-[#5f6672] dark:text-slate-400 uppercase tracking-wider px-6 py-3">To</th>
                  <th className="text-right text-xs font-medium text-[#5f6672] dark:text-slate-400 uppercase tracking-wider px-6 py-3">Spot Rate</th>
                  <th className="text-left text-xs font-medium text-[#5f6672] dark:text-slate-400 uppercase tracking-wider px-6 py-3">Effective From</th>
                  <th className="text-left text-xs font-medium text-[#5f6672] dark:text-slate-400 uppercase tracking-wider px-6 py-3">Effective To</th>
                  <th className="text-left text-xs font-medium text-[#5f6672] dark:text-slate-400 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-[#5f6672] dark:text-slate-400 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedConversions.map((conv) => {
                  const active = isRateActive(conv);
                  const expired = isRateExpired(conv);
                  const isEditing = editingId === conv.id;

                  if (isEditing) {
                    return (
                      <tr key={conv.id} className="border-b border-[#e5e7eb] dark:border-slate-700 bg-[#eef6fc] dark:bg-slate-700/40">
                        <td className="px-6 py-3">
                          <select
                            value={formData.from_currency}
                            onChange={(e) => setFormData(prev => ({ ...prev, from_currency: e.target.value }))}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-[#1a6fb5] rounded text-sm focus:ring-2 focus:ring-[#1a6fb5]"
                          >
                            {FROM_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <ArrowRightLeft className="h-3.5 w-3.5 text-[#999] mx-auto" />
                        </td>
                        <td className="px-6 py-3">
                          <select
                            value={formData.to_currency}
                            onChange={(e) => setFormData(prev => ({ ...prev, to_currency: e.target.value }))}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-[#1a6fb5] rounded text-sm focus:ring-2 focus:ring-[#1a6fb5]"
                          >
                            {TO_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="number"
                            step="0.00000001"
                            min="0"
                            value={formData.spot_rate}
                            onChange={(e) => setFormData(prev => ({ ...prev, spot_rate: e.target.value }))}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-[#1a6fb5] rounded text-sm text-right focus:ring-2 focus:ring-[#1a6fb5]"
                            autoFocus
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="date"
                            value={formData.effective_from}
                            onChange={(e) => setFormData(prev => ({ ...prev, effective_from: e.target.value }))}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-[#1a6fb5] rounded text-sm focus:ring-2 focus:ring-[#1a6fb5]"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="date"
                            value={formData.effective_to}
                            onChange={(e) => setFormData(prev => ({ ...prev, effective_to: e.target.value }))}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-[#1a6fb5] rounded text-sm focus:ring-2 focus:ring-[#1a6fb5]"
                          />
                        </td>
                        <td className="px-6 py-3" />
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={handleUpdate}
                              disabled={saving}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                            >
                              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 text-[#5f6672] hover:bg-[#f0f0f0] dark:hover:bg-slate-700 rounded transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={conv.id} className="border-b border-[#e5e7eb] dark:border-slate-700 hover:bg-[#f8f9fb] dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#f4f5f7] dark:bg-slate-700 text-sm font-semibold text-[#1a1f36] dark:text-white tracking-wide">
                          {conv.from_currency}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <ArrowRightLeft className="h-3.5 w-3.5 text-[#999] mx-auto" />
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#f4f5f7] dark:bg-slate-700 text-sm font-semibold text-[#1a1f36] dark:text-white tracking-wide">
                          {conv.to_currency}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-mono font-medium text-[#1a1f36] dark:text-white">
                          {Number(conv.spot_rate).toFixed(8)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-[#333] dark:text-slate-300">
                        {new Date(conv.effective_from + 'T00:00:00').toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-[#333] dark:text-slate-300">
                        {conv.effective_to
                          ? new Date(conv.effective_to + 'T00:00:00').toLocaleDateString()
                          : <span className="text-[#999] dark:text-slate-500">Open</span>
                        }
                      </td>
                      <td className="px-6 py-3">
                        {expired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            Expired
                          </span>
                        ) : active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Future
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(conv)}
                            className="p-1.5 hover:bg-[#eef0f3] dark:hover:bg-slate-700 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5 text-[#5f6672]" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(conv)}
                            className="p-1.5 hover:bg-[#f2dede] dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {filteredConversions.length > pageSize && (
          <div className="px-6 py-3 border-t border-[#e5e7eb] dark:border-slate-700">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredConversions.length / pageSize)}
              totalItems={filteredConversions.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Conversion Rate"
          message={`Are you sure you want to remove the ${deleteTarget.from_currency} to ${deleteTarget.to_currency} rate effective ${new Date(deleteTarget.effective_from + 'T00:00:00').toLocaleDateString()}?`}
          itemName={`${deleteTarget.from_currency} → ${deleteTarget.to_currency}`}
          deleteType="hard"
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default CurrencyConversionManagement;
