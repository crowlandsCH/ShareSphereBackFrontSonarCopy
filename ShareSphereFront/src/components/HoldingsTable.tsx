import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface HoldingsTableProps {
  holdings: Array<{
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

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
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
              <th className="px-6 py-3 text-left text-gray-700">Quantity</th>
              <th className="px-6 py-3 text-left text-gray-700">Current Price</th>
              <th className="px-6 py-3 text-left text-gray-700">Total Value</th>
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
