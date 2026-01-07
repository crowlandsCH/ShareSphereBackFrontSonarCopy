import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { HoldingsTable } from './HoldingsTable';
import { TradeHistory } from './TradeHistory';
import { EmptyState } from './EmptyState';
import { apiFetch } from '../api/client';
import { useAuth } from './AuthContext';

interface PortfolioResponse {
  shareholderId: number;
  shareholderName: string;
  email: string;
  totalPortfolioValue: number;
  ownedShares: OwnedShare[];
  totalSharesCount: number;
}


interface OwnedShare {
  shareId: number;
  companyId: number;
  companyName: string;
  tickerSymbol: string;
  quantity:  number;
  currentPricePerShare: number;
  totalValue: number;
  stockExchange: string;
}
// API Endpoint: GET /api/portfolio/holdings

// API Endpoint: GET /api/portfolio/trades

export function Portfolio() {
    const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
  // Sorting for holdings table
  type HoldingsSortField = 'companyName' | 'quantity' | 'currentPricePerShare' | 'totalValue';
  type SortDirection = 'asc' | 'desc' | null;
  const [holdingsSortField, setHoldingsSortField] = useState<HoldingsSortField | null>(null);
  const [holdingsSortDirection, setHoldingsSortDirection] = useState<SortDirection>(null);

  // Simulated API calls
    useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!user?.shareholderId) {
        setError('No shareholder ID available');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await apiFetch<PortfolioResponse>(
          `/api/shareholders/${user.shareholderId}/portfolio`
        );
        
        // ⭐ Destructure:  ownedShares separat, rest in summary
        const { ownedShares, ... summaryData } = data;
        
        setSummary(summaryData);
        setHoldings(ownedShares);
        
      } catch (err) {
        setError(err instanceof Error ? err. message : 'Failed to fetch portfolio');
        console.error(err);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [user?.shareholderId]);

    useEffect(() => {
    const fetchTradeData = async () => {
      if (!user?.shareholderId) {
        setError('No shareholder ID available');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await  apiFetch<any[]>(
          `/api/shareholders/${user.shareholderId}/trades`
        );
        
        setTrades(data);
        
      } catch (err) {
        setError(err instanceof Error ? err. message : 'Failed to fetch Trades');
        console.error(err);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTradeData();
  }, [user?.shareholderId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const handleHoldingsSort = (field: HoldingsSortField) => {
    if (holdingsSortField === field) {
      if (holdingsSortDirection === 'asc') setHoldingsSortDirection('desc');
      else if (holdingsSortDirection === 'desc') { setHoldingsSortDirection(null); setHoldingsSortField(null); }
    } else {
      setHoldingsSortField(field);
      setHoldingsSortDirection('asc');
    }
  };

  const getSortedHoldings = () => {
    if (!holdingsSortField || !holdingsSortDirection) return holdings;
    return [...holdings].sort((a, b) => {
      const aValue = a[holdingsSortField];
      const bValue = b[holdingsSortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const cmp = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return holdingsSortDirection === 'asc' ? cmp : -cmp;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return holdingsSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  const hasHoldings = holdings.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Portfolio</h1>
        <p className="text-gray-600">Track your holdings and investment performance</p>
      </div>

      {/* Portfolio Summary */}
      {hasHoldings ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Portfolio Value</span>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-gray-900 mb-1">{formatCurrency(summary.totalPortfolioValue)}</div>
            <div className={`flex items-center gap-1 text-sm ${summary.changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>

            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Shares Owned</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-gray-900">{summary.totalSharesCount}</div>
            <div className="text-sm text-gray-500">Across {holdings.length} holdings</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Trades</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-gray-900">{trades.length}</div>
            <div className="text-sm text-gray-500">All time</div>
          </div>
        </div>
      ) : null}

      {/* Holdings Table */}
      <div>
        <h2 className="text-gray-900 mb-4">Holdings</h2>
        {hasHoldings ? (
          <HoldingsTable
            holdings={getSortedHoldings()}
            sortField={holdingsSortField}
            sortDirection={holdingsSortDirection}
            onSort={handleHoldingsSort}
          />
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No holdings yet"
            description="You haven't purchased any shares yet. Start trading to build your portfolio."
            action={{
              label: 'Start Trading',
              onClick: () => window.location.href = '/trade',
            }}
          />
        )}
      </div>

      {/* Trade History */}
      <div>
        <h2 className="text-gray-900 mb-4">Trade History</h2>
        <TradeHistory trades={trades} />
      </div>
    </div>
  );
}