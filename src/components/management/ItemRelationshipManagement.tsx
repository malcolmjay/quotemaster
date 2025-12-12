import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import ItemRelationshipEditModal from './ItemRelationshipEditModal';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

type ItemRelationship = Database['public']['Tables']['item_relationships']['Row'];

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface ItemRelationshipWithDetails extends ItemRelationship {
  from_item_sku?: string;
  from_item_name?: string;
  to_item_sku?: string;
  to_item_name?: string;
}

export default function ItemRelationshipManagement() {
  const [relationships, setRelationships] = useState<ItemRelationshipWithDetails[]>([]);
  const [filteredRelationships, setFilteredRelationships] = useState<ItemRelationshipWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<ItemRelationship | null>(null);
  const [relationshipToDelete, setRelationshipToDelete] = useState<ItemRelationship | null>(null);

  useEffect(() => {
    loadRelationships();
  }, []);

  useEffect(() => {
    filterRelationships();
  }, [searchTerm, typeFilter, relationships]);

  const loadRelationships = async () => {
    try {
      const [{ data: rels, error: relsError }, { data: products, error: productsError }] = await Promise.all([
        supabase.from('item_relationships').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id, sku, name')
      ]);

      if (relsError) throw relsError;
      if (productsError) throw productsError;

      const productMap = new Map(products?.map(p => [p.id, { sku: p.sku, name: p.name }]) || []);

      const relsWithDetails = (rels || []).map(rel => ({
        ...rel,
        from_item_sku: productMap.get(rel.from_item_id)?.sku,
        from_item_name: productMap.get(rel.from_item_id)?.name,
        to_item_sku: productMap.get(rel.to_item_id)?.sku,
        to_item_name: productMap.get(rel.to_item_id)?.name
      }));

      setRelationships(relsWithDetails);
    } catch (error) {
      console.error('Error loading item relationships:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRelationships = () => {
    let filtered = [...relationships];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rel =>
        rel.from_item_sku?.toLowerCase().includes(term) ||
        rel.from_item_name?.toLowerCase().includes(term) ||
        rel.to_item_sku?.toLowerCase().includes(term) ||
        rel.to_item_name?.toLowerCase().includes(term) ||
        rel.type.toLowerCase().includes(term)
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(rel => rel.type === typeFilter);
    }

    setFilteredRelationships(filtered);
  };

  const handleEdit = (relationship: ItemRelationship) => {
    setSelectedRelationship(relationship);
    setShowEditModal(true);
  };

  const handleDelete = (relationship: ItemRelationship) => {
    setRelationshipToDelete(relationship);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!relationshipToDelete) return;

    try {
      const { error } = await supabase
        .from('item_relationships')
        .delete()
        .eq('id', relationshipToDelete.id);

      if (error) throw error;

      await loadRelationships();
      setShowDeleteModal(false);
      setRelationshipToDelete(null);
    } catch (error) {
      console.error('Error deleting item relationship:', error);
    }
  };

  const handleSave = async () => {
    await loadRelationships();
    setShowEditModal(false);
    setSelectedRelationship(null);
  };

  const uniqueTypes = Array.from(new Set(relationships.map(r => r.type))).sort();

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#666]">Loading item relationships...</div>
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
            Management / Item Relationships
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-normal text-[#333]">Item Relationships</h1>
              <p className="text-xs text-[#666] mt-1">Manage product relationships and associations</p>
            </div>
            <button
              onClick={() => {
                setSelectedRelationship(null);
                setShowEditModal(true);
              }}
              className="flex items-center gap-2 bg-[#428bca] hover:bg-[#3276b1] text-white px-4 py-2 rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Relationship
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5">
        <div className="bg-white rounded border border-[#d4d4d4]">
          <div className="p-4 border-b border-[#d4d4d4]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#999] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by SKU, product name, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca]"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#999] w-5 h-5" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] appearance-none"
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f0f0f0]">
                <tr className="border-b border-[#d4d4d4]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wide">
                    From Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wide">
                    To Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wide">
                    Reciprocal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wide">
                    Effective From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wide">
                    Effective To
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[#666] uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e8e8e8]">
                {filteredRelationships.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-[#666]">
                      {searchTerm || typeFilter ? 'No relationships match your filters' : 'No item relationships yet'}
                    </td>
                  </tr>
                ) : (
                  filteredRelationships.map((relationship) => (
                    <tr key={relationship.id} className="hover:bg-[#f5f5f5] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#333]">
                          {relationship.from_item_sku}
                        </div>
                        <div className="text-sm text-[#666]">
                          {relationship.from_item_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#333]">
                          {relationship.to_item_sku}
                        </div>
                        <div className="text-sm text-[#666]">
                          {relationship.to_item_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-[#d9edf7] text-[#31708f] border border-[#bce8f1]">
                          {relationship.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                        {relationship.reciprocal ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                        {formatDate(relationship.effective_from)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                        {formatDate(relationship.effective_to)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(relationship)}
                            className="text-[#428bca] hover:text-[#3276b1] transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(relationship)}
                            className="text-[#d9534f] hover:text-[#c9302c] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-[#d4d4d4] bg-[#f0f0f0]">
            <div className="text-sm text-[#666]">
              Showing {filteredRelationships.length} of {relationships.length} item relationships
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <ItemRelationshipEditModal
          relationship={selectedRelationship}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRelationship(null);
          }}
          onSave={handleSave}
        />
      )}

      {showDeleteModal && relationshipToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setRelationshipToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Item Relationship"
          message={`Are you sure you want to delete this relationship?`}
        />
      )}
    </div>
  );
}
