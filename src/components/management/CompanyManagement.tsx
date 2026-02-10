import React, { useState, useEffect } from 'react';
import { Building2, Search, Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Pagination } from '../common/Pagination';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

interface Company {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  const { showToast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      showToast('error', 'Failed to load companies', 'Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAdd = async () => {
    const trimmed = newCompanyName.trim();
    if (!trimmed) return;

    if (companies.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast('warning', 'Company already exists', `"${trimmed}" is already in the list.`);
      return;
    }

    try {
      setAddingCompany(true);
      const { error } = await supabase
        .from('companies')
        .insert({ name: trimmed });

      if (error) throw error;

      setNewCompanyName('');
      setShowAddForm(false);
      showToast('success', 'Company added', `"${trimmed}" has been added.`);
      await fetchCompanies();
    } catch (error) {
      showToast('error', 'Failed to add company', 'Please try again.');
    } finally {
      setAddingCompany(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    if (companies.some(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== id)) {
      showToast('warning', 'Name already taken', `"${trimmed}" already exists.`);
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .update({ name: trimmed, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      showToast('success', 'Company updated', `Name changed to "${trimmed}".`);
      await fetchCompanies();
    } catch (error) {
      showToast('error', 'Failed to update company', 'Please try again.');
    }
  };

  const handleToggleActive = async (company: Company) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: !company.is_active, updated_at: new Date().toISOString() })
        .eq('id', company.id);

      if (error) throw error;

      showToast('success', company.is_active ? 'Company deactivated' : 'Company activated', '');
      await fetchCompanies();
    } catch (error) {
      showToast('error', 'Failed to update company status', 'Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) {
        if (error.message.includes('violates foreign key')) {
          showToast('warning', 'Cannot delete', 'This company is referenced by existing quote line items. Deactivate it instead.');
        } else {
          throw error;
        }
        return;
      }

      showToast('success', 'Company deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
      await fetchCompanies();
    } catch (error) {
      showToast('error', 'Failed to delete company', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#e5e7eb] dark:border-slate-700 shadow-sm">
        <div className="px-6 py-4 border-b border-[#e5e7eb] dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#1a6fb5]/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[#1a6fb5]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1a1f36] dark:text-white">Company Management</h2>
                <p className="text-xs text-[#5f6672] dark:text-slate-400">
                  Manage companies used in award and bid tracking dropdowns
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#5f6672] dark:text-slate-400 bg-[#f4f5f7] dark:bg-slate-700 px-2.5 py-1 rounded-full">
                {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'}
              </span>
              <button
                onClick={() => { setShowAddForm(true); setNewCompanyName(''); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1a6fb5] text-white text-sm font-medium rounded-md hover:bg-[#155a94] shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Company
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-[#e5e7eb] dark:border-slate-700 bg-[#f8f9fb] dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search companies..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-[#dce0e6] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white placeholder-[#999] focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5]"
              />
            </div>
          </div>
        </div>

        {showAddForm && (
          <div className="px-6 py-3 border-b border-[#e5e7eb] dark:border-slate-700 bg-[#eef6fc] dark:bg-slate-700/40">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Enter company name..."
                className="flex-1 max-w-md px-3 py-2 bg-white dark:bg-slate-700 border border-[#dce0e6] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white placeholder-[#999] focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5]"
                autoFocus
              />
              <button
                onClick={handleAdd}
                disabled={addingCompany || !newCompanyName.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1a6fb5] text-white text-sm rounded-md hover:bg-[#155a94] disabled:opacity-50 transition-colors"
              >
                {addingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 text-[#5f6672] hover:bg-[#e8e8e8] rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-[#1a6fb5] animate-spin" />
            </div>
          ) : paginatedCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-10 w-10 text-[#cdd1d9] mb-3" />
              <p className="text-sm text-[#5f6672]">
                {searchTerm ? 'No companies match your search' : 'No companies added yet'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5e7eb] dark:border-slate-700 bg-[#f8f9fb] dark:bg-slate-800/80">
                  <th className="text-left text-xs font-medium text-[#5f6672] dark:text-slate-400 uppercase tracking-wider px-6 py-3">Company Name</th>
                  <th className="text-left text-xs font-medium text-[#5f6672] dark:text-slate-400 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-[#5f6672] dark:text-slate-400 uppercase tracking-wider px-6 py-3">Created</th>
                  <th className="text-right text-xs font-medium text-[#5f6672] dark:text-slate-400 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map((company) => (
                  <tr key={company.id} className="border-b border-[#e5e7eb] dark:border-slate-700 hover:bg-[#f8f9fb] dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-3">
                      {editingId === company.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdate(company.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="flex-1 max-w-xs px-2 py-1 bg-white dark:bg-slate-700 border border-[#1a6fb5] rounded text-sm focus:ring-2 focus:ring-[#1a6fb5]"
                            autoFocus
                          />
                          <button onClick={() => handleUpdate(company.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-[#5f6672] hover:bg-[#f0f0f0] rounded">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={`text-sm font-medium ${company.is_active ? 'text-[#1a1f36] dark:text-white' : 'text-[#999] dark:text-slate-500 line-through'}`}>
                          {company.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleToggleActive(company)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          company.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-[#f4f5f7] text-[#999] hover:bg-[#e8e8e8] dark:bg-slate-700 dark:text-slate-500'
                        }`}
                      >
                        {company.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-3 text-xs text-[#5f6672] dark:text-slate-400">
                      {new Date(company.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingId(company.id); setEditName(company.name); }}
                          className="p-1.5 hover:bg-[#eef0f3] dark:hover:bg-slate-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#5f6672]" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(company)}
                          className="p-1.5 hover:bg-[#f2dede] dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredCompanies.length > pageSize && (
          <div className="px-6 py-3 border-t border-[#e5e7eb] dark:border-slate-700">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredCompanies.length / pageSize)}
              totalItems={filteredCompanies.length}
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
          title="Delete Company"
          message="Are you sure you want to remove this company? If it is referenced in existing quotes, consider deactivating it instead."
          itemName={deleteTarget.name}
          deleteType="hard"
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default CompanyManagement;
