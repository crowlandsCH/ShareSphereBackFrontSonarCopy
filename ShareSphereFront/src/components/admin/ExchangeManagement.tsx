import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ConfirmDialog';
import { apiFetch } from '../../api/client';

interface Exchange {
  exchangeId: number; // ⭐ API verwendet exchangeId
  name: string;
  country: string;
  currency: string;
}

export function ExchangeManagement() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExchange, setEditingExchange] = useState<Exchange | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Exchange | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currency:  '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ⭐ Exchanges laden
  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Exchange[]>('/api/stockexchanges');
        setExchanges(data);
      } catch (err) {
        console.error('Failed to fetch exchanges:', err);
        toast.error('Failed to load stock exchanges');
        setExchanges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExchanges();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (! formData.name.trim()) {
      newErrors.name = 'Exchange name is required';
    }

    if (!formData. country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!formData.currency.trim()) {
      newErrors.currency = 'Currency is required';
    } else if (formData.currency.length !== 3) {
      newErrors.currency = 'Currency code must be 3 characters (e.g., USD, EUR)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenForm = (exchange?:  Exchange) => {
    if (exchange) {
      setEditingExchange(exchange);
      setFormData({
        name: exchange.name,
        country: exchange.country,
        currency: exchange.currency,
      });
    } else {
      setEditingExchange(null);
      setFormData({ name: '', country:  '', currency: '' });
    }
    setErrors({});
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingExchange(null);
    setFormData({ name: '', country: '', currency: '' });
    setErrors({});
  };

  // ⭐ CREATE oder UPDATE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      const exchangeData = {
        name: formData.name,
        country: formData.country,
        currency: formData.currency. toUpperCase(),
      };

      if (editingExchange) {
        // ✅ UPDATE:  PUT /api/stockexchanges/{id}
        await apiFetch(`/api/stockexchanges/${editingExchange.exchangeId}`, {
          method: 'PUT',
          body: JSON.stringify(exchangeData),
        });

        setExchanges(prev => prev.map(e => 
          e.exchangeId === editingExchange.exchangeId 
            ? { ...e, ... exchangeData } 
            :  e
        ));
        toast.success('Exchange updated successfully');
        
      } else {
        // ✅ CREATE: POST /api/stockexchanges
        const newExchange = await apiFetch<Exchange>('/api/stockexchanges', {
          method: 'POST',
          body: JSON.stringify(exchangeData),
        });

        setExchanges(prev => [...prev, newExchange]);
        toast.success('Exchange created successfully');
      }

      handleCloseForm();
      
    } catch (error:  any) {
      console.error('Exchange operation failed:', error);
      toast.error(error?. message || 'Failed to save exchange');
    }
  };

  // ⭐ DELETE
  const handleDelete = async (exchange:  Exchange) => {
    try {
      // ✅ DELETE: DELETE /api/stockexchanges/{id}
      await apiFetch(`/api/stockexchanges/${exchange.exchangeId}`, {
        method: 'DELETE',
      });
      
      setExchanges(prev => prev.filter(e => e.exchangeId !== exchange. exchangeId));
      setDeleteConfirm(null);
      toast.success('Exchange deleted successfully');
      
    } catch (error: any) {
      console.error('Delete exchange failed:', error);
      toast.error(error?.message || 'Failed to delete exchange');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Exchange Management</h2>
          <p className="text-sm text-gray-600">Manage stock exchanges in the system</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover: bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          Add Exchange
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-gray-700">Country</th>
                <th className="px-6 py-3 text-left text-gray-700">Currency</th>
                <th className="px-6 py-3 text-right text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exchanges.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No stock exchanges found.  Click "Add Exchange" to create one. 
                  </td>
                </tr>
              ) : (
                exchanges.map((exchange) => (
                  <tr key={exchange.exchangeId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-medium">{exchange.name}</td>
                    <td className="px-6 py-4 text-gray-600">{exchange.country}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                        {exchange.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenForm(exchange)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          aria-label={`Edit ${exchange.name}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(exchange)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          aria-label={`Delete ${exchange.name}`}
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
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">{editingExchange ? 'Edit Exchange' : 'Add New Exchange'}</h3>
              <button
                onClick={handleCloseForm}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Exchange Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    setErrors(prev => ({ ... prev, name: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., New York Stock Exchange"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="country"
                  value={formData.country}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, country: e.target.value }));
                    setErrors(prev => ({ ...prev, country: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus: ring-2 focus:ring-blue-500 ${
                    errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., United States"
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.country}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, currency: e.target.value. toUpperCase() }));
                    setErrors(prev => ({ ... prev, currency: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.currency ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., USD"
                  maxLength={3}
                />
                <p className="mt-1 text-xs text-gray-500">3-letter ISO currency code</p>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.currency}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus: outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {editingExchange ? 'Update Exchange' : 'Create Exchange'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Exchange"
          message={`Are you sure you want to delete "${deleteConfirm.name}"?  This will also affect all associated companies and shares.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          variant="danger"
        />
      )}
    </div>
  );
}