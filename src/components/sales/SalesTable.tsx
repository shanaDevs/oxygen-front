import { Sale } from '@/types';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { Banknote, CreditCard, Smartphone, Eye, XCircle } from 'lucide-react';

interface SalesTableProps {
  sales: Sale[];
  onView?: (sale: Sale) => void;
  onCancel?: (sale: Sale) => void;
}

export function SalesTable({ sales, onView, onCancel }: SalesTableProps) {
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
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Sale ID</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Date & Time</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Items</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Payment</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Total</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm text-muted-foreground">{sale.id}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-muted-foreground">{formatDateTime(sale.createdAt)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant="secondary">
                      {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {getPaymentIcon(sale.paymentMethod)}
                      <span className="text-sm capitalize">{sale.paymentMethod}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant={getStatusVariant(sale.status)}>
                      {sale.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold">${sale.total.toFixed(2)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(sale)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      )}
                      {onCancel && sale.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancel(sale)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel
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
