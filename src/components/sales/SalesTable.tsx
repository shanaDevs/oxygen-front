import { Sale } from '@/types';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { Banknote, CreditCard, Smartphone, Eye, XCircle, FileText, Download } from 'lucide-react';
import { pdfService } from '@/services';

interface SalesTableProps {
  sales: Sale[];
  onView?: (sale: Sale) => void;
  onCancel?: (sale: Sale) => void;
  onPreview?: (url: string, title: string) => void;
}

export function SalesTable({ sales, onView, onCancel, onPreview }: SalesTableProps) {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusVariant = (status: Sale['status']): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentIcon = (method: Sale['paymentMethod']) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase">Sale ID</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase">Date & Time</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase">Customer</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase">Items</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase">Payment</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-muted-foreground uppercase">Total</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onView?.(sale)}
                >
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm font-bold text-primary hover:underline">
                      #{sale.id.split('-').pop()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-muted-foreground">{formatDateTime(sale.createdAt)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-medium">{sale.customerName || 'Walk-in Customer'}</span>
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant="secondary">
                      {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {getPaymentIcon(sale.paymentMethod)}
                      <span className="text-sm capitalize">{sale.paymentMethod.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant={getStatusVariant(sale.status)} className="capitalize">
                      {sale.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="font-bold">Rs. {sale.total.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(sale)}
                        className="h-8 w-8 p-0"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPreview?.(pdfService.getInvoiceUrl(sale.id), `Invoice - ${sale.id.split('-').pop()}`)}
                        className="h-8 w-8 p-0 text-primary"
                        title="Preview"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => pdfService.downloadInvoice(sale.id, sale.id)}
                        className="h-8 w-8 p-0 text-slate-500"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {onCancel && sale.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancel(sale)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Cancel Sale"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
