'use client';

import { CustomerTransaction } from '@/types';
import { Card, CardContent, Badge } from '@/components/ui';
import { PackagePlus, PackageMinus, RefreshCw, FileText, Eye, Download, Banknote, Package } from 'lucide-react';
import { Button } from '@/components/ui';
import { pdfService } from '@/services';

interface CustomerTransactionsTableProps {
  transactions: CustomerTransaction[];
  showCustomerName?: boolean;
  onPreview?: (url: string, title: string) => void;
  onViewBottles?: (transaction: CustomerTransaction) => void;
}

export function CustomerTransactionsTable({
  transactions,
  showCustomerName = true,
  onPreview,
  onViewBottles,
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
      case 'payment':
        return { icon: Banknote, className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' };
      case 'sale':
        return { icon: FileText, className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' };
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
                  Details
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Total (LKR)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Paid (LKR)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Credit (LKR)
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => {
                const typeConfig = getTypeConfig(tx.transactionType);
                const TypeIcon = typeConfig.icon;
                const isBottleTransaction = tx.transactionType === 'issue' || tx.transactionType === 'return' || tx.transactionType === 'refill' || tx.transactionType === 'sale';

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
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {isBottleTransaction ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span>{tx.bottleType || '-'}</span>
                            <Badge variant="outline" className="text-xs">
                              {tx.bottleCount} bottles
                            </Badge>
                          </div>
                          {tx.invoiceNumber && (
                            <span className="text-xs font-mono text-primary">#{tx.invoiceNumber}</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground italic">Payment transaction</span>
                          {tx.invoiceNumber && (
                            <span className="text-xs font-mono text-primary">#{tx.invoiceNumber}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      {tx.totalAmount > 0 ? tx.totalAmount.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 text-right font-medium">
                      {tx.amountPaid > 0 ? tx.amountPaid.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 text-right font-medium">
                      {tx.creditAmount > 0 ? tx.creditAmount.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getStatusVariant(tx.paymentStatus)}>
                        {tx.paymentStatus.charAt(0).toUpperCase() + tx.paymentStatus.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isBottleTransaction && onViewBottles && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewBottles(tx)}
                            className="h-8 px-2 text-xs gap-1"
                            title="View Bottles"
                          >
                            <Package className="h-3 w-3" />
                            Bottles
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (tx.transactionType === 'issue' || tx.transactionType === 'refill') {
                              onPreview?.(pdfService.getInvoiceUrl(tx.id), `Invoice - ${tx.id.split('-').pop()}`);
                            } else {
                              const url = pdfService.getPaymentReceiptUrl({
                                id: tx.id,
                                name: tx.customerName,
                                amount: tx.amountPaid || tx.totalAmount,
                                type: 'customer',
                                method: 'cash',
                                remainingBalance: tx.creditAmount
                              });
                              onPreview?.(url, `Receipt - ${tx.id.split('-').pop()}`);
                            }
                          }}
                          className="h-8 w-8 p-0"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (tx.transactionType === 'issue' || tx.transactionType === 'refill') {
                              pdfService.downloadInvoice(tx.id, tx.id);
                            } else {
                              pdfService.downloadPaymentReceipt({
                                id: tx.id,
                                name: tx.customerName,
                                amount: tx.amountPaid || tx.totalAmount,
                                type: 'customer',
                                method: 'cash',
                                remainingBalance: tx.creditAmount
                              });
                            }
                          }}
                          className="h-8 w-8 p-0"
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
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
