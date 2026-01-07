import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../api/client';
import { useAuth } from './AuthContext';

// ⭐ Interfaces für TypeScript
interface AvailableShare {
  shareId: number;
  company: {
    name: string;
    tickerSymbol: string;
  };
  price: number;
  availableQuantity: number;
}

interface OwnedShare {
  shareId: number;
  companyName: string;
  tickerSymbol: string;
  quantity:  number;
  currentPricePerShare: number;
}

export function TradeForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const preselectedData = location.state as { share?:  any; company?: any } | null;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [availableShares, setAvailableShares] = useState<AvailableShare[]>([]); // ⭐ Zum Kaufen
  const [ownedShares, setOwnedShares] = useState<OwnedShare[]>([]);             // ⭐ Zum Verkaufen
  
  const [formData, setFormData] = useState({
    brokerId: '',
    shareId: '',
    quantity: '',
    tradeType: 'Buy' as 'Buy' | 'Sell',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ⭐ Fetch Brokers (einmalig)
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const data = await apiFetch<any[]>('/api/brokers');
        setBrokers(data);
      } catch (err) {
        console.error('Failed to fetch brokers:', err);
        toast.error('Failed to load brokers');
      }
    };

    fetchBrokers();
  }, []);

  // ⭐ Fetch Shares basierend auf Trade Type
  useEffect(() => {
    const fetchShares = async () => {
      if (!user?.shareholderId) return;

      setLoading(true);
      
      try {
        if (formData.tradeType === 'Buy') {
          // Alle verfügbaren Shares vom Market laden
          const data = await apiFetch<AvailableShare[]>('/api/shares');
          setAvailableShares(data);
          setOwnedShares([]); // Reset owned shares
        } else {
          // Portfolio des Users laden (nur die Shares die er besitzt)
          const portfolioData = await apiFetch<any>(
            `/api/shareholders/${user.shareholderId}/portfolio`
          );
          setOwnedShares(portfolioData. ownedShares);
          setAvailableShares([]); // Reset available shares
        }

        // Pre-fill wenn von Share-Liste kommend
        if (preselectedData?.share) {
          setFormData(prev => ({
            ...prev,
            shareId: preselectedData.share.shareId?. toString() || 
                     preselectedData.share.ShareId?.toString() || '',
          }));
        }
      } catch (error) {
        console.error('Failed to fetch shares:', error);
        toast.error('Failed to load shares');
      } finally {
        setLoading(false);
      }
    };

    fetchShares();
  }, [formData.tradeType, user?.shareholderId]);

  // ⭐ Dynamisch die richtige Share-Liste und Selected Share verwenden
  const shares = formData.tradeType === 'Buy' ?  availableShares : ownedShares;
  
  const selectedShare = shares.find(s => 
    s.shareId === parseInt(formData.shareId)
  );

  const validateForm = () => {
    const newErrors:  Record<string, string> = {};

    if (!formData.brokerId) {
      newErrors.brokerId = 'Please select a broker';
    }

    if (!formData.shareId) {
      newErrors.shareId = 'Please select a share';
    }

    if (!formData.quantity) {
      newErrors.quantity = 'Please enter quantity';
    } else {
      const qty = parseInt(formData.quantity);
      if (isNaN(qty) || qty <= 0) {
        newErrors.quantity = 'Quantity must be a positive number';
      } else if (! Number.isInteger(qty)) {
        newErrors.quantity = 'Quantity must be a whole number';
      } else if (selectedShare) {
        // ⭐ Validierung je nach Trade Type
        if (formData.tradeType === 'Buy') {
          const available = (selectedShare as AvailableShare).availableQuantity;
          if (qty > available) {
            newErrors.quantity = `Only ${available} shares available`;
          }
        } else {
          const owned = (selectedShare as OwnedShare).quantity;
          if (qty > owned) {
            newErrors. quantity = `You only own ${owned} shares`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    if (!selectedShare || !formData.quantity) return 0;
    const qty = parseInt(formData.quantity);
    if (isNaN(qty)) return 0;
    
    // ⭐ Preis je nach Trade Type
    const price = formData.tradeType === 'Buy' 
      ? (selectedShare as AvailableShare).price
      : (selectedShare as OwnedShare).currentPricePerShare;
    
    return qty * price;
  };

const handleSubmit = async (e: React. FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    toast.error('Please fix the errors in the form');
    return;
  }

  if (! user?. shareholderId) {
    toast.error('User information not available');
    return;
  }

  setSubmitting(true);

  try {
    // ⭐ UNTERSCHIEDLICHE API CALLS JE NACH TRADE TYPE
    if (formData.tradeType === 'Buy') {
      // ✅ KAUF:  POST /api/shareholders/{shareholderId}/purchase
      const purchaseData = {
        shareId: parseInt(formData.shareId),
        quantity: parseInt(formData.quantity),
        brokerId: parseInt(formData. brokerId),
      };

      await apiFetch(`/api/shareholders/${user.shareholderId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

    } else {
      // ✅ VERKAUF: POST /api/shareholders/{shareholderId}/sell-shares
      const sellData = {
        shareId:  parseInt(formData.shareId),
        quantity: parseInt(formData.quantity),
        brokerId: parseInt(formData.brokerId),
      };

      await apiFetch(`/api/shareholders/${user.shareholderId}/sell-shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sellData),
      });
    }
    
    // ✅ SUCCESS
    setShowConfirmation(true);
    toast.success(`${formData.tradeType} order executed successfully!`);
    
    setTimeout(() => {
      navigate('/portfolio');
    }, 2000);
    
  } catch (error:  any) {
    console.error('Trade execution failed:', error);
    toast.error(error?. message || 'Failed to execute trade. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading trading options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Execute Trade</h1>
        <p className="text-gray-600">Buy or sell shares through your preferred broker</p>
      </div>

      {showConfirmation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="text-green-900 font-medium">Trade Executed Successfully</h3>
            <p className="text-sm text-green-700 mt-1">
              Your {formData.tradeType. toLowerCase()} order for {formData.quantity} shares has been processed.
              Redirecting to portfolio...
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Trade Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trade Type <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, tradeType: 'Buy', shareId: '', quantity: '' }));
                setErrors({});
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                formData.tradeType === 'Buy'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, tradeType: 'Sell', shareId: '', quantity: '' }));
                setErrors({});
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                formData.tradeType === 'Sell'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        {/* Broker Selection */}
        <div>
          <label htmlFor="broker" className="block text-sm font-medium text-gray-700 mb-2">
            Select Broker <span className="text-red-500">*</span>
          </label>
          <select
            id="broker"
            value={formData.brokerId}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, brokerId: e.target.value }));
              setErrors(prev => ({ ...prev, brokerId: '' }));
            }}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.brokerId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Choose a broker... </option>
            {brokers. map(broker => (
              <option key={broker.brokerId} value={broker.brokerId}>
                {broker.name} - {broker.licenseNumber}
              </option>
            ))}
          </select>
          {errors.brokerId && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.brokerId}
            </p>
          )}
        </div>

        {/* Share Selection */}
        <div>
          <label htmlFor="share" className="block text-sm font-medium text-gray-700 mb-2">
            Select Share <span className="text-red-500">*</span>
          </label>
          <select
            id="share"
            value={formData. shareId}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, shareId: e.target.value }));
              setErrors(prev => ({ ...prev, shareId: '' }));
            }}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus: ring-2 focus:ring-blue-500 ${
              errors.shareId ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={shares.length === 0}
          >
            <option value="">Choose a share...</option>
            {formData.tradeType === 'Buy' 
              ? availableShares.map(share => (
                  <option key={share.shareId} value={share.shareId}>
                    {share.company.name} ({share.company.tickerSymbol}) - {formatCurrency(share.price)} - ({share.availableQuantity} Available)
                  </option>
                ))
              : ownedShares.map(share => (
                  <option key={share.shareId} value={share. shareId}>
                    {share.companyName} ({share. tickerSymbol}) - {formatCurrency(share.currentPricePerShare)} - ({share.quantity} Owned)
                  </option>
                ))
            }
          </select>
          {errors.shareId && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.shareId}
            </p>
          )}
          
          {/* ⭐ Info wenn keine Shares verfügbar */}
          {shares.length === 0 && (
            <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formData.tradeType === 'Buy' 
                ? 'No shares available for purchase at the moment.'
                : 'You don\'t own any shares to sell.  Start buying to build your portfolio!'}
            </p>
          )}
        </div>

        {/* Share Details */}
        {selectedShare && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-blue-900">Share Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Price per Share:</span>
                <div className="text-blue-900 font-semibold">
                  {formatCurrency(
                    formData.tradeType === 'Buy' 
                      ? (selectedShare as AvailableShare).price
                      : (selectedShare as OwnedShare).currentPricePerShare
                  )}
                </div>
              </div>
              <div>
                <span className="text-blue-700">
                  {formData.tradeType === 'Buy' ?  'Available: ' : 'You Own:'}
                </span>
                <div className="text-blue-900 font-semibold">
                  {formData. tradeType === 'Buy' 
                    ? (selectedShare as AvailableShare).availableQuantity.toLocaleString()
                    : (selectedShare as OwnedShare).quantity.toLocaleString()
                  } shares
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="quantity"
            min="1"
            step="1"
            value={formData.quantity}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, quantity: e.target.value }));
              setErrors(prev => ({ ...prev, quantity: '' }));
            }}
            placeholder="Enter number of shares"
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.quantity ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={! selectedShare}
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.quantity}
            </p>
          )}
        </div>

        {/* Total Amount */}
        {selectedShare && formData.quantity && ! errors.quantity && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting || shares.length === 0}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              formData.tradeType === 'Buy'
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-5 h-5" />
                Execute {formData.tradeType}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/portfolio')}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Portfolio
          </button>
        </div>
      </form>

      {/* Information Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">Important Information</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>All trades are executed at current market prices</li>
          <li>
            {formData.tradeType === 'Buy' 
              ? 'Ensure you have sufficient funds in your brokerage account'
              : 'You can only sell shares you currently own'}
          </li>
          <li>Completed trades will appear in your portfolio immediately</li>
          <li>Trade confirmations will be sent to your registered email</li>
        </ul>
      </div>
    </div>
  );
}