import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Loader2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ConfirmDialog';
import { apiFetch } from '../../api/client';

interface Broker {
  brokerId: number;
  name: string;
  licenseNumber: string;
  email: string;
}

// ⭐ Sort configuration
type SortField = 'name' | 'licenseNumber' | 'email';
type SortDirection = 'asc' | 'desc' | null;

export function BrokerManagement() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Broker | null>(null);

  // ⭐ Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    email: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ⭐ Brokers laden
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Broker[]>('/api/brokers');
        setBrokers(data);
      } catch (err) {
        console.error('Failed to fetch brokers:', err);
        toast.error('Failed to load brokers');
        setBrokers([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchBrokers();
  }, []);

  // ⭐ Handle column sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through:  asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ⭐ Get sorted brokers
  const getSortedBrokers = () => {
    if (!sortField || !sortDirection) {
      return brokers;
    }

    return [...brokers].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // String comparison (case-insensitive)
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // ⭐ Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }

    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 text-blue-600" />;
    }

    if (sortDirection === 'desc') {
      return <ArrowDown className="w-4 h-4 text-blue-600" />;
    }

    return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Broker name is required';
    } else if (brokers. some(b => b.name. toLowerCase() === formData.name.toLowerCase() && b.brokerId !== editingBroker?.brokerId)) {
      newErrors.name = 'A broker with this name already exists';
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License Number is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenForm = (broker?: Broker) => {
    if (broker) {
      setEditingBroker(broker);
      setFormData({
        name: broker.name,
        licenseNumber: broker.licenseNumber,
        email: broker.email,
      });
    } else {
      setEditingBroker(null);
      setFormData({ name:  '', licenseNumber: '', email:  '' });
    }
    setErrors({});
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBroker(null);
    setFormData({ name: '', licenseNumber: '', email: '' });
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
      const brokerData = {
        name: formData.name,
        licenseNumber: formData.licenseNumber,
        email: formData.email,
      };

      if (editingBroker) {
        // ✅ UPDATE:  PUT /api/brokers/{id}
        await apiFetch(`/api/brokers/${editingBroker.brokerId}`, {
          method: 'PUT',
          body: JSON.stringify(brokerData),
        });

        setBrokers(prev => prev.map(b => 
          b.brokerId === editingBroker.brokerId 
            ? { ...b, ... brokerData } 
            : b
        ));
        toast.success('Broker updated successfully');
        
      } else {
        // ✅ CREATE: POST /api/brokers
        const newBroker = await apiFetch<Broker>('/api/brokers', {
          method: 'POST',
          body: JSON.stringify(brokerData),
        });

        setBrokers(prev => [...prev, newBroker]);
        toast.success('Broker created successfully');
      }

      handleCloseForm();
      
    } catch (error:  any) {
      console.error('Broker operation failed:', error);
      toast.error(error?. message || 'Failed to save broker');
    }
  };

  // ⭐ DELETE
  const handleDelete = async (broker: Broker) => {
    try {
      // ✅ DELETE: DELETE /api/brokers/{id}
      await apiFetch(`/api/brokers/${broker.brokerId}`, {
        method: 'DELETE',
      });
      
      setBrokers(prev => prev.filter(b => b.brokerId !== broker.brokerId));
      setDeleteConfirm(null);
      toast.success('Broker deleted successfully');
      
    } catch (error: any) {
      console.error('Delete broker failed:', error);
      toast.error(error?.message || 'Failed to delete broker');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const sortedBrokers = getSortedBrokers();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Broker Management</h2>
          <p className="text-sm text-gray-600">Manage registered brokers in the system</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus: outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          Add Broker
        </button>
      </div>

      {/* Brokers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    <span>Name</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort('licenseNumber')}
                >
                  <div className="flex items-center gap-2">
                    <span>License Number</span>
                    {renderSortIcon('licenseNumber')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-2">
                    <span>Contact Email</span>
                    {renderSortIcon('email')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedBrokers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No brokers found.  Click "Add Broker" to create one.
                  </td>
                </tr>
              ) : (
                sortedBrokers.map((broker) => (
                  <tr key={broker.brokerId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900">{broker.name}</td>
                    <td className="px-6 py-4 text-gray-600">{broker.licenseNumber}</td>
                    <td className="px-6 py-4 text-gray-600">{broker.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenForm(broker)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          aria-label={`Edit ${broker.name}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(broker)}
                          className="p-2 text-red-600 hover: bg-red-50 rounded-md transition-colors"
                          aria-label={`Delete ${broker.name}`}
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">{editingBroker ? 'Edit Broker' : 'Add New Broker'}</h3>
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
                <label htmlFor="name" className="block text-sm text-gray-700 mb-1">
                  Broker Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., E*TRADE"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors. name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="licenseNumber" className="block text-sm text-gray-700 mb-1">
                  License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, licenseNumber: e.target.value }));
                    setErrors(prev => ({ ...prev, licenseNumber: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="LIC-123456"
                />
                {errors.licenseNumber && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.licenseNumber}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm text-gray-700 mb-1">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData. email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus: ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="support@broker.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus: outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {editingBroker ? 'Update Broker' : 'Create Broker'}
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

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Broker"
          message={`Are you sure you want to delete "${deleteConfirm.name}"?  This action cannot be undone.`}
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