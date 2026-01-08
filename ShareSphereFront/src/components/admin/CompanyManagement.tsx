import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Loader2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ConfirmDialog';
import { apiFetch } from '../../api/client';

// ⭐ API Response Interfaces
interface Share {
  shareId: number;
  companyId: number;
  price:   number;
  availableQuantity: number;
  company: null;
}

interface CompanyApiResponse {
  companyId: number;
  name: string;
  tickerSymbol: string;
  sector:   string;
  exchangeId:   number;
  stockExchange: {
    exchangeId: number;
    name: string;
    country: string;
    currency: string;
  };
  shares: Share[];
}

// ⭐ API Request Interfaces
interface CompanyRequest {
  name: string;
  tickerSymbol: string;
  sector: string;
  exchangeId: number;
}

interface ShareRequest {
  companyId:   number;
  price:  number;
  availableQuantity: number;
}

// ⭐ Internal Interface for display
interface Company {
  id: number;
  name: string;
  tickerSymbol:   string;
  sector: string;
  exchangeId: number;
  exchangeName? :  string;
  sharePrice: number;
  shareQuantity: number;
  shareId? :  number;
}

interface Exchange {
  exchangeId: number;
  name: string;
  country: string;
  currency: string;
}

// ⭐ Sort configuration
type SortField = 'name' | 'tickerSymbol' | 'sector' | 'exchangeName' | 'sharePrice' | 'shareQuantity';
type SortDirection = 'asc' | 'desc' | null;

export function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Company | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ⭐ Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const [formData, setFormData] = useState({
    name: '',
    ticker: '',
    sector: '',
    sharePrice: '',
    shareQuantity: '',
    exchangeId:   '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ⭐ Fetch companies helper
  const fetchCompanies = async () => {
    try {
      const companiesData = await apiFetch<CompanyApiResponse[]>('/api/companies');
      
      const transformedCompanies = companiesData.map(company => {
        const firstShare = company.shares && company.shares.length > 0 ? company.shares[0] : null;
        
        return {
          id: company.companyId,
          name: company.name,
          tickerSymbol: company. tickerSymbol,
          sector: company.sector,
          exchangeId: company.exchangeId,
          exchangeName: company. stockExchange?.name || 'Unknown',
          sharePrice: firstShare?. price || 0,
          shareQuantity: firstShare?.availableQuantity || 0,
          shareId: firstShare?.shareId,
        };
      });
      
      setCompanies(transformedCompanies);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      toast.error('Failed to load companies');
      throw err;
    }
  };

  // ⭐ Load both exchanges and companies
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const exchangesData = await apiFetch<Exchange[]>('/api/stockexchanges');
        setExchanges(exchangesData);
        
        await fetchCompanies();
      } catch (err) {
        console.error('Failed to fetch data:', err);
        toast.error('Failed to load data');
        setExchanges([]);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // ⭐ Get sorted companies
  const getSortedCompanies = () => {
    if (!sortField || !sortDirection) {
      return companies;
    }

    return [... companies]. sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
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
    const newErrors:   Record<string, string> = {};

    if (!formData.name. trim()) {
      newErrors.name = 'Company name is required';
    }

    if (! formData.ticker.trim()) {
      newErrors.ticker = 'Ticker symbol is required';
    } else if (companies.some(c => c.tickerSymbol. toUpperCase() === formData.ticker.toUpperCase() && c.id !== editingCompany?.id)) {
      newErrors.ticker = 'A company with this ticker symbol already exists';
    }

    if (!formData.sector.trim()) {
      newErrors.sector = 'Sector is required';
    }

    if (!formData.sharePrice. trim()) {
      newErrors.sharePrice = 'Share price is required';
    } else {
      const price = parseFloat(formData.sharePrice);
      if (isNaN(price) || price <= 0) {
        newErrors.sharePrice = 'Share price must be a positive number';
      }
    }

    if (!formData.shareQuantity.trim()) {
      newErrors.shareQuantity = 'Share quantity is required';
    } else {
      const quantity = parseInt(formData.shareQuantity);
      if (isNaN(quantity) || quantity <= 0 || ! Number.isInteger(parseFloat(formData.shareQuantity))) {
        newErrors.shareQuantity = 'Share quantity must be a positive integer';
      }
    }

    if (!formData.exchangeId) {
      newErrors.exchangeId = 'Please select an exchange';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenForm = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name:   company.name,
        ticker: company.tickerSymbol,
        sector: company.sector,
        sharePrice: company.sharePrice.toString(),
        shareQuantity: company.shareQuantity. toString(),
        exchangeId:  company.exchangeId.toString(),
      });
    } else {
      setEditingCompany(null);
      setFormData({ name: '', ticker: '', sector:   '', sharePrice: '', shareQuantity: '', exchangeId: '' });
    }
    setErrors({});
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCompany(null);
    setFormData({ name: '', ticker: '', sector:   '', sharePrice: '', shareQuantity: '', exchangeId: '' });
    setErrors({});
  };

  const handleSubmit = async (e: React. FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      const exchangeId = parseInt(formData.exchangeId);
      const sharePrice = parseFloat(formData.sharePrice);
      const shareQuantity = parseInt(formData.shareQuantity);

      const companyPayload:   CompanyRequest = {
        name:  formData.name,
        tickerSymbol: formData.ticker. toUpperCase(),
        sector: formData.sector,
        exchangeId,
      };

      let companyId:   number;

      if (editingCompany) {
        await apiFetch(`/api/companies/${editingCompany.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON. stringify(companyPayload),
        });
        companyId = editingCompany.id;
      } else {
        const newCompany = await apiFetch<CompanyApiResponse>('/api/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body:  JSON.stringify(companyPayload),
        });
        companyId = newCompany.companyId;
      }

      const sharePayload: ShareRequest = {
        companyId:   companyId,
        price:   sharePrice,
        availableQuantity: shareQuantity,
      };

      if (editingCompany && editingCompany.shareId) {
        await apiFetch(`/api/shares/${editingCompany.shareId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body:  JSON.stringify(sharePayload),
        });
      } else {
        await apiFetch('/api/shares', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sharePayload),
        });
      }

      toast.success(editingCompany ? 'Company updated successfully' : 'Company created successfully');

      await fetchCompanies();
      handleCloseForm();
    } catch (err:   any) {
      console.error('Failed to save company:', err);
      toast.error(err. message || 'Failed to save company.   Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (company: Company) => {
    setSubmitting(true);

    try {
      await apiFetch(`/api/companies/${company.id}`, {
        method: 'DELETE',
      });

      toast.success('Company deleted successfully');
      
      await fetchCompanies();
      setDeleteConfirm(null);
    } catch (err:  any) {
      console.error('Failed to delete company:', err);
      toast.error(err. message || 'Failed to delete company.  Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const sortedCompanies = getSortedCompanies();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Company Management</h2>
          <p className="text-sm text-gray-600">Manage companies listed on exchanges</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

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
                    <span>Company Name</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort('tickerSymbol')}
                >
                  <div className="flex items-center gap-2">
                    <span>Ticker</span>
                    {renderSortIcon('tickerSymbol')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort('sector')}
                >
                  <div className="flex items-center gap-2">
                    <span>Sector</span>
                    {renderSortIcon('sector')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort('exchangeName')}
                >
                  <div className="flex items-center gap-2">
                    <span>Exchange</span>
                    {renderSortIcon('exchangeName')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort('sharePrice')}
                >
                  <div className="flex items-center justify-end gap-2">
                    <span>Share Price</span>
                    {renderSortIcon('sharePrice')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort('shareQuantity')}
                >
                  <div className="flex items-center justify-end gap-2">
                    <span>Available Quantity</span>
                    {renderSortIcon('shareQuantity')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900">{company.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">
                      {company.tickerSymbol}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{company.sector}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {company.exchangeName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 font-medium">
                    ${company.sharePrice. toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {company.shareQuantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenForm(company)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        aria-label={`Edit ${company.name}`}
                        disabled={submitting}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(company)}
                        className="p-2 text-red-600 hover: bg-red-50 rounded-md transition-colors"
                        aria-label={`Delete ${company.name}`}
                        disabled={submitting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">{editingCompany ? 'Edit Company' : 'Add New Company'}</h3>
              <button
                onClick={handleCloseForm}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                aria-label="Close"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
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
                    errors.name ? 'border-red-500' :   'border-gray-300'
                  }`}
                  placeholder="e.g., Apple Inc."
                  disabled={submitting}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="ticker" className="block text-sm text-gray-700 mb-1">
                  Ticker Symbol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="ticker"
                  value={formData. ticker}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, ticker: e.target.value. toUpperCase() }));
                    setErrors(prev => ({ ... prev, ticker: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.ticker ? 'border-red-500' :  'border-gray-300'
                  }`}
                  placeholder="e.g., AAPL"
                  maxLength={10}
                  disabled={submitting}
                />
                {errors.ticker && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.ticker}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="sector" className="block text-sm text-gray-700 mb-1">
                  Sector <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, sector: e.target.value }));
                    setErrors(prev => ({ ...prev, sector: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus: outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.sector ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Technology"
                  disabled={submitting}
                />
                {errors.sector && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.sector}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="exchangeId" className="block text-sm text-gray-700 mb-1">
                  Stock Exchange <span className="text-red-500">*</span>
                </label>
                <select
                  id="exchangeId"
                  value={formData.exchangeId}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, exchangeId: e.target.value }));
                    setErrors(prev => ({ ... prev, exchangeId: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.exchangeId ? 'border-red-500' :   'border-gray-300'
                  }`}
                  disabled={submitting}
                >
                  <option value="">Select an exchange... </option>
                  {exchanges. map(exchange => (
                    <option key={exchange.exchangeId} value={exchange.exchangeId}>
                      {exchange.name} ({exchange.country})
                    </option>
                  ))}
                </select>
                {errors.exchangeId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.exchangeId}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="sharePrice" className="block text-sm text-gray-700 mb-1">
                  Share Price $ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="sharePrice"
                    value={formData.sharePrice}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, sharePrice: e.target.value }));
                      setErrors(prev => ({ ... prev, sharePrice: '' }));
                    }}
                    step="0.01"
                    min="0"
                    className={`w-full pl-7 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.sharePrice ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    disabled={submitting}
                  />
                </div>
                {errors.sharePrice && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.sharePrice}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="shareQuantity" className="block text-sm text-gray-700 mb-1">
                  Available Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="shareQuantity"
                  value={formData. shareQuantity}
                  onChange={(e) => {
                    setFormData(prev => ({ ... prev, shareQuantity: e. target.value }));
                    setErrors(prev => ({ ...prev, shareQuantity: '' }));
                  }}
                  step="1"
                  min="1"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.shareQuantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 1000"
                  disabled={submitting}
                />
                {errors.shareQuantity && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.shareQuantity}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover: bg-blue-700 transition-colors focus:outline-none focus: ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCompany ? 'Update Company' : 'Create Company'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          title="Delete Company"
          message={`Are you sure you want to delete "${deleteConfirm.name}"?  This will also affect all associated shares.`}
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