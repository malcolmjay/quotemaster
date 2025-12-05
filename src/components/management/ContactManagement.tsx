import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Trash2, User, Mail, Phone, Briefcase, Star, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Contact {
  id?: string;
  customer_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  is_primary: boolean;
  notes?: string;
}

interface ContactManagementProps {
  customer: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ContactManagement: React.FC<ContactManagementProps> = ({
  customer,
  isOpen,
  onClose
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customer) {
      fetchContacts();
    }
  }, [isOpen, customer]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('customer_contacts')
        .select('*')
        .eq('customer_number', customer.customer_number)
        .order('is_primary', { ascending: false })
        .order('last_name');

      if (fetchError) throw fetchError;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingContact({
      customer_number: customer.customer_number,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      title: '',
      department: '',
      is_primary: contacts.length === 0,
      notes: ''
    });
    setIsCreating(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!editingContact) return;

    try {
      setSaving(true);
      setError(null);

      if (isCreating) {
        const { error: insertError } = await supabase
          .from('customer_contacts')
          .insert([editingContact]);

        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase
          .from('customer_contacts')
          .update(editingContact)
          .eq('id', editingContact.id);

        if (updateError) throw updateError;
      }

      await fetchContacts();
      setEditingContact(null);
      setIsCreating(false);
    } catch (err) {
      console.error('Error saving contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('customer_contacts')
        .delete()
        .eq('id', contactId);

      if (deleteError) throw deleteError;
      await fetchContacts();
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError('Failed to delete contact');
    }
  };

  const handleSetPrimary = async (contactId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('customer_contacts')
        .update({ is_primary: false })
        .eq('customer_number', customer.customer_number);

      if (updateError) throw updateError;

      const { error: setPrimaryError } = await supabase
        .from('customer_contacts')
        .update({ is_primary: true })
        .eq('id', contactId);

      if (setPrimaryError) throw setPrimaryError;

      await fetchContacts();
    } catch (err) {
      console.error('Error setting primary contact:', err);
      setError('Failed to set primary contact');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Manage Contacts
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {customer.name} ({customer.customer_number})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading contacts...</p>
            </div>
          ) : editingContact ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isCreating ? 'Create New Contact' : 'Edit Contact'}
                </h3>
                <button
                  onClick={() => {
                    setEditingContact(null);
                    setIsCreating(false);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingContact.first_name}
                    onChange={(e) => setEditingContact({ ...editingContact, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingContact.last_name}
                    onChange={(e) => setEditingContact({ ...editingContact, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editingContact.email}
                    onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editingContact.phone || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingContact.title || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editingContact.department || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={editingContact.notes || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingContact.is_primary}
                      onChange={(e) => setEditingContact({ ...editingContact, is_primary: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Set as primary contact
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSave}
                  disabled={saving || !editingContact.first_name || !editingContact.last_name || !editingContact.email}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save Contact'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Contacts ({contacts.length})
                </h3>
                <button
                  onClick={handleCreate}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Contact</span>
                </button>
              </div>

              {contacts.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No contacts yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Click "Add Contact" to create one
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {contact.first_name} {contact.last_name}
                            </h4>
                            {contact.is_primary && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm">
                            {contact.title && (
                              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                <Briefcase className="h-4 w-4" />
                                <span>{contact.title}</span>
                                {contact.department && <span> • {contact.department}</span>}
                              </div>
                            )}
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                              <Mail className="h-4 w-4" />
                              <a href={`mailto:${contact.email}`} className="hover:text-purple-600">
                                {contact.email}
                              </a>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                <Phone className="h-4 w-4" />
                                <a href={`tel:${contact.phone}`} className="hover:text-purple-600">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                            {contact.notes && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 italic">
                                {contact.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!contact.is_primary && (
                            <button
                              onClick={() => handleSetPrimary(contact.id!)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors"
                              title="Set as Primary"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(contact)}
                            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                            title="Edit Contact"
                          >
                            <User className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete Contact"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
