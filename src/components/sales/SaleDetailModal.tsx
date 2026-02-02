'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Badge, ScrollArea, Button, Card, CardContent } from '@/components/ui';
import { Receipt, Package, Eye, Download, CreditCard, CheckCircle, AlertCircle, Clock, X, ChevronRight, ShoppingCart } from 'lucide-react';
import { Sale, SaleItem } from '@/types';
import { pdfService } from '@/services';

interface SaleDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
    onPreview?: (url: string, title: string) => void;
}

export function SaleDetailModal({
    isOpen,
    onClose,
    sale,
    onPreview,
}: SaleDetailModalProps) {
    const [viewMode, setViewMode] = useState<'items' | 'payments'>('items');

    if (!sale) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
            case 'cancelled':
                return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentMethodBadge = (method: string) => {
        const methodColors: Record<string, string> = {
            cash: 'bg-green-100 text-green-700 dark:bg-green-900/50',
            card: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50',
            mobile: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50',
            bank_transfer: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50',
        };

        return (
            <Badge className={methodColors[method] || 'bg-gray-100 text-gray-700'}>
                {method.replace('_', ' ').toUpperCase()}
            </Badge>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Receipt className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Sale Details</DialogTitle>
                                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                    <span className="font-mono">#{sale.id.split('-').pop()}</span>
                                    <span>{formatDate(sale.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Sale Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-4">
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                            <div className="text-xs text-blue-700 dark:text-blue-400 mb-1">Items</div>
                            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{sale.items.length}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                            <div className="text-xs text-green-700 dark:text-green-400 mb-1">Subtotal</div>
                            <div className="text-2xl font-bold text-green-900 dark:text-green-100">Rs. {sale.subtotal.toLocaleString()}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                            <div className="text-xs text-purple-700 dark:text-purple-400 mb-1">Tax</div>
                            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">Rs. {(sale.tax || 0).toLocaleString()}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800">
                            <div className="text-xs text-cyan-700 dark:text-cyan-400 mb-1">Total</div>
                            <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">Rs. {sale.total.toLocaleString()}</div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6">
                    {/* Tab Buttons */}
                    <div className="flex gap-2 mb-6">
                        <Button
                            variant={viewMode === 'items' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('items')}
                            className="gap-2"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            Items ({sale.items.length})
                        </Button>
                        <Button
                            variant={viewMode === 'payments' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('payments')}
                            className="gap-2"
                        >
                            <CreditCard className="h-4 w-4" />
                            Payment Details
                        </Button>
                    </div>

                    <ScrollArea className="max-h-[50vh]">
                        {viewMode === 'items' ? (
                            <div className="space-y-4">
                                {/* Items List */}
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Sale Items
                                    </h4>
                                    <div className="space-y-2">
                                        {sale.items.map((item, index) => (
                                            <Card key={index}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="font-semibold">{item.productName || item.name}</div>
                                                            <div className="text-sm text-muted-foreground mt-1">
                                                                SKU: {item.productId || item.sku || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-lg">Rs. {((item.price || 0) * (item.quantity || 0)).toLocaleString()}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {item.quantity} × Rs. {(item.price || 0).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {item.discount && item.discount > 0 && (
                                                        <div className="mt-2 pt-2 border-t flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Discount:</span>
                                                            <span className="text-red-600 font-semibold">-Rs. {item.discount.toLocaleString()}</span>
                                                        </div>
                                                    )}

                                                    {item.tax && item.tax > 0 && (
                                                        <div className="mt-1 flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Tax:</span>
                                                            <span className="font-semibold">Rs. {item.tax.toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Financial Summary */}
                                <div className="mt-6 p-4 rounded-lg border bg-muted/30">
                                    <h4 className="font-semibold mb-3">Financial Summary</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal:</span>
                                            <span className="font-semibold">Rs. {sale.subtotal.toLocaleString()}</span>
                                        </div>
                                        {sale.discount && sale.discount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Discount:</span>
                                                <span className="text-red-600 font-semibold">-Rs. {sale.discount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {sale.tax && sale.tax > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Tax:</span>
                                                <span className="font-semibold">Rs. {sale.tax.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t flex justify-between">
                                            <span className="font-bold text-lg">Total:</span>
                                            <span className="font-bold text-lg text-primary">Rs. {sale.total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Payment Information */}
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        Payment Information
                                    </h4>

                                    <div className="space-y-4">
                                        <Card>
                                            <CardContent className="p-4">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground">Payment Method:</span>
                                                        {getPaymentMethodBadge(sale.paymentMethod)}
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground">Status:</span>
                                                        {getStatusBadge(sale.status)}
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground">Amount Paid:</span>
                                                        <span className="font-bold text-green-600 text-lg">Rs. {sale.total.toLocaleString()}</span>
                                                    </div>

                                                    {sale.change && sale.change > 0 && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-muted-foreground">Change Given:</span>
                                                            <span className="font-semibold">Rs. {sale.change.toLocaleString()}</span>
                                                        </div>
                                                    )}

                                                    {sale.reference && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-muted-foreground">Reference:</span>
                                                            <span className="font-mono text-sm">{sale.reference}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Customer Info if available */}
                                        {sale.customerId && (
                                            <Card>
                                                <CardContent className="p-4">
                                                    <h5 className="font-semibold mb-2">Customer Information</h5>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Customer ID:</span>
                                                            <span className="font-mono">{sale.customerId}</span>
                                                        </div>
                                                        {sale.customerName && (
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Name:</span>
                                                                <span className="font-medium">{sale.customerName}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </ScrollArea>

                    {/* Actions */}
                    <div className="flex gap-2 mt-6 pt-4 border-t">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                const url = pdfService.getSaleReceiptUrl(sale.id);
                                onPreview?.(url, `Receipt - ${sale.id.split('-').pop()}`);
                            }}
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview Receipt
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => pdfService.downloadSaleReceipt(sale.id)}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
