'use client';

import { CustomerTransaction } from '@/types';
import { Card, CardContent, Badge } from '@/components/ui';
import { PackagePlus, PackageMinus, RefreshCw, FileText } from 'lucide-react';

interface CustomerTransactionsTableProps {
  transactions: CustomerTransaction[];
  showCustomerName?: boolean;
}

export function CustomerTransactionsTable({
  transactions,
  showCustomerName = true,
}: CustomerTransactionsTableProps) {
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'full':
        return 'default';
      case 'partial':
        return 'secondary';
      case 'credit':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'issue':
        return { icon: PackagePlus, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' };
      case 'return':
        return { icon: PackageMinus, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' };
      case 'refill':
        return { icon: RefreshCw, className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' };
      default:
        return { icon: FileText, className: 'bg-muted text-muted-foreground' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                  Type
                </th>
                {showCustomerName && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Customer
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Bottle Type
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Paid
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Credit
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => {
                const typeConfig = getTypeConfig(tx.transactionType);
                const TypeIcon = typeConfig.icon;
                return (
                  <tr key={tx.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${typeConfig.className}`}>
                        <TypeIcon className="h-3 w-3" />
                        {tx.transactionType.charAt(0).toUpperCase() + tx.transactionType.slice(1)}
                      </span>
                    </td>
                    {showCustomerName && (
                      <td className="px-4 py-3 text-sm font-medium">
                        {tx.customerName}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-muted-foreground">{tx.bottleType}</td>
                    <td className="px-4 py-3 text-sm text-center font-medium">
                      {tx.bottleCount}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      {tx.totalAmount > 0 ? `Rs. ${tx.totalAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 text-right">
                      {tx.amountPaid > 0 ? `Rs. ${tx.amountPaid.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 text-right font-medium">
                      {tx.creditAmount > 0 ? `Rs. ${tx.creditAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getStatusVariant(tx.paymentStatus)}>
                        {tx.paymentStatus.charAt(0).toUpperCase() + tx.paymentStatus.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
