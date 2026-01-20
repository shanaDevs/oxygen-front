import { Sale } from '@/types';

interface RecentSalesProps {
  sales: Sale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: Sale['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
    }
  };

  const getPaymentIcon = (method: Sale['paymentMethod']) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'mobile':
        return '📱';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {sales.map((sale) => (
          <div key={sale.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getPaymentIcon(sale.paymentMethod)}</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-500">{formatTime(sale.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${sale.total.toFixed(2)}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(sale.status)}`}>
                  {sale.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-100">
        <a href="/sales" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium">
          View all sales →
        </a>
      </div>
    </div>
  );
}
