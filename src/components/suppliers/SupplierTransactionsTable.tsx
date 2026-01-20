'use client';

import { SupplierTransaction } from '@/types';
import { Card, CardContent, Badge, Button } from '@/components/ui';

interface SupplierTransactionsTableProps {
  transactions: SupplierTransaction[];
  onPaymentUpdate?: (transaction: SupplierTransaction) => void;
}

export function SupplierTransactionsTable({
  transactions,
  onPaymentUpdate,
}: SupplierTransactionsTableProps) {
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'full':
        return 'default';
      case 'partial':
        return 'secondary';
      case 'outstanding':
        return 'destructive';
      default:
        return 'outline';
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
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Supplier
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Liters
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Price/L
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Paid
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Outstanding
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
                {onPaymentUpdate && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {tx.supplierName}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {tx.litersSupplied.toLocaleString()} L
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground text-right">
                    Rs. {tx.pricePerLiter}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-right">
                    Rs. {tx.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 text-right">
                    Rs. {tx.amountPaid.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 text-right font-medium">
                    {tx.outstanding > 0 ? `Rs. ${tx.outstanding.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={getStatusVariant(tx.paymentStatus)}>
                      {tx.paymentStatus.charAt(0).toUpperCase() + tx.paymentStatus.slice(1)}
                    </Badge>
                  </td>
                  {onPaymentUpdate && (
                    <td className="px-4 py-3 text-center">
                      {tx.outstanding > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => onPaymentUpdate(tx)}
                        >
                          Pay
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
