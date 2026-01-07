import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface HoldingsTableProps {
  holdings?: Array<{
    id: number;
    shareId: number;
    companyName: string;
    ticker: string;
    shareType: string;
    quantity: number;
    purchasePrice: number;
    currentPricePerShare: number;
    totalValue: number;
  }>;
}

type SortField = 'companyName' | 'quantity' | 'currentPricePerShare' | 'totalValue';
type SortDirection = 'asc' | 'desc' | null;

interface HoldingsTablePropsExtended extends HoldingsTableProps {
  sortField?: SortField | null;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
}

export function HoldingsTable({ holdings, sortField = null, sortDirection = null, onSort }: HoldingsTablePropsExtended) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-3 h-3 text-blue-600" />;
    if (sortDirection === 'desc') return <ArrowDown className="w-3 h-3 text-blue-600" />;
    return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
  };

  const calculateGainLoss = (purchasePrice: number, currentPrice: number, quantity: number) => {
    const totalPurchase = purchasePrice * quantity;
    const totalCurrent = currentPrice * quantity;
    const difference = totalCurrent - totalPurchase;
    const percentage = (difference / totalPurchase) * 100;
    
    return { difference, percentage };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700">Company</th>
              <th
                className="px-6 py-3 text-left text-gray-700 cursor-pointer select-none"
                onClick={() => onSort && onSort('quantity')}
              >
                <div className="flex items-center gap-2">
                  <span>Quantity</span>
                  {renderSortIcon('quantity')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-gray-700 cursor-pointer select-none"
                onClick={() => onSort && onSort('currentPricePerShare')}
              >
                <div className="flex items-center gap-2">
                  <span>Current Price</span>
                  {renderSortIcon('currentPricePerShare')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-gray-700 cursor-pointer select-none"
                onClick={() => onSort && onSort('totalValue')}
              >
                <div className="flex items-center gap-2">
                  <span>Total Value</span>
                  {renderSortIcon('totalValue')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {holdings.map((holding) => {
              const { difference, percentage } = calculateGainLoss(
                holding.purchasePrice,
                holding.currentPricePerShare,
                holding.quantity
              );
              const isGain = difference >= 0;

              return (
                <tr key={holding.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-gray-900">{holding.companyName}</div>
                      <div className="text-sm text-gray-500">{holding.ticker}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{holding.quantity.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-900">{formatCurrency(holding.currentPricePerShare)}</td>
                  <td className="px-6 py-4 text-gray-900">{formatCurrency(holding.totalValue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
