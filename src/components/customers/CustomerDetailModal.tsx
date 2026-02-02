'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Badge, ScrollArea, Button, Card, CardContent, Input } from '@/components/ui';
import { User, FileText, Package, Eye, Download, CreditCard, CheckCircle, AlertCircle, Clock, X, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerTransaction, CustomerPayment } from '@/types';
import { pdfService } from '@/services';

interface CustomerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: {
        id: string;
        name: string;
        phone?: string;
        email?: string;
        totalCredit: number;
        bottlesInHand: number;
    } | null;
    transactions: CustomerTransaction[];
    onViewBottles?: (transaction: CustomerTransaction) => void;
    onPreview?: (url: string, title: string) => void;
}

export function CustomerDetailModal({
    isOpen,
    onClose,
    customer,
    transactions,
    onViewBottles,
    onPreview,
}: CustomerDetailModalProps) {
    const [selectedInvoice, setSelectedInvoice] = useState<CustomerTransaction | null>(null);
    const [viewMode, setViewMode] = useState<'details' | 'payments'>('details');
    const [searchTerm, setSearchTerm] = useState('');
    const [showMobileList, setShowMobileList] = useState(true);

    // Reset view when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setShowMobileList(true);
        }
    }, [isOpen]);

    if (!customer) return null;

    const customerTransactions = transactions.filter(tx => tx.customerId === customer.id);
    const bottleTransactions = customerTransactions.filter(tx =>
        tx.transactionType === 'issue' || tx.transactionType === 'return' || tx.transactionType === 'refill' || tx.transactionType === 'sale'
    );

    const filteredInvoices = bottleTransactions.filter(tx => {
        const query = searchTerm.toLowerCase();
        const invoiceNum = (tx.invoiceNumber || tx.id.split('-').pop())?.toLowerCase() || '';
        const bottleType = tx.bottleType?.toLowerCase() || '';
        return invoiceNum.includes(query) || bottleType.includes(query);
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'full':
                return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50"><CheckCircle className="h-3 w-3 mr-1" />Paid Full</Badge>;
            case 'partial':
                return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50"><Clock className="h-3 w-3 mr-1" />Partial</Badge>;
            case 'credit':
                return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Credit</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleInvoiceClick = (transaction: CustomerTransaction) => {
        setSelectedInvoice(transaction);
        setViewMode('details');
        setShowMobileList(false);
    };

    const handleInvoiceNumberClick = (transaction: CustomerTransaction, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedInvoice(transaction);
        setViewMode('payments');
        setShowMobileList(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-(--breakpoint-md) lg:max-w-6xl max-h-[90vh] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-xl truncate">{customer.name}</DialogTitle>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                    {customer.phone && <span className="flex items-center gap-1">📞 {customer.phone}</span>}
                                    {customer.email && <span className="flex items-center gap-1 truncate">📧 {customer.email}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 shadow-sm">
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-700 dark:text-blue-400 mb-1">Total Invoices</div>
                            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{bottleTransactions.length}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 shadow-sm">
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-red-700 dark:text-red-400 mb-1">Outstanding Credit</div>
                            <div className="text-xl font-bold text-red-900 dark:text-red-100">Rs. {customer.totalCredit.toLocaleString()}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 shadow-sm">
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-purple-700 dark:text-purple-400 mb-1">Bottles in Hand</div>
                            <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{customer.bottlesInHand}</div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-col md:grid md:grid-cols-[380px_1fr] h-[calc(90vh-280px)] overflow-hidden">
                    {/* Left Panel - Invoice List */}
                    <div className={cn(
                        "border-r flex flex-col min-h-0",
                        !showMobileList && "hidden md:flex"
                    )}>
                        <div className="p-4 border-b bg-muted/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    All Invoices ({bottleTransactions.length})
                                </h3>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search invoice number or type..."
                                    className="pl-8 h-9 text-xs bg-background"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 absolute right-1 top-1/2 -translate-y-1/2"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-2">
                                {filteredInvoices.length > 0 ? (
                                    filteredInvoices.map((tx) => (
                                        <Card
                                            key={tx.id}
                                            className={cn(
                                                "cursor-pointer transition-all hover:shadow-md",
                                                selectedInvoice?.id === tx.id ? "ring-2 ring-primary bg-primary/5" : ""
                                            )}
                                            onClick={() => handleInvoiceClick(tx)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div
                                                            className="font-mono text-sm font-bold text-primary hover:underline cursor-pointer"
                                                            onClick={(e) => handleInvoiceNumberClick(tx, e)}
                                                        >
                                                            #{tx.invoiceNumber || tx.id.split('-').pop()}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {formatDate(tx.createdAt)}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Type:</span>
                                                        <Badge variant="outline" className="capitalize">{tx.transactionType}</Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Bottles:</span>
                                                        <span className="font-medium">{tx.bottleCount} × {tx.bottleType}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Total:</span>
                                                        <span className="font-bold">Rs. {tx.totalAmount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Status:</span>
                                                        {getStatusBadge(tx.paymentStatus)}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm font-medium">No results found</p>
                                        {searchTerm && <p className="text-[10px] mt-1">Try a different search term</p>}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right Panel - Invoice Details or Payment History */}
                    <div className={cn(
                        "flex-1 flex flex-col min-h-0",
                        showMobileList && "hidden md:flex"
                    )}>
                        {selectedInvoice ? (
                            <>
                                <div className="p-4 border-b bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="md:hidden h-8 w-8 p-0"
                                                onClick={() => setShowMobileList(true)}
                                            >
                                                <ChevronRight className="h-4 w-4 rotate-180" />
                                            </Button>
                                            <h3 className="font-semibold flex items-center gap-2 truncate">
                                                {viewMode === 'details' ? (
                                                    <>
                                                        <Package className="h-4 w-4 shrink-0" />
                                                        <span className="truncate">Details: #{selectedInvoice.invoiceNumber || selectedInvoice.id.split('-').pop()}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard className="h-4 w-4 shrink-0" />
                                                        <span className="truncate">Payments: #{selectedInvoice.invoiceNumber || selectedInvoice.id.split('-').pop()}</span>
                                                    </>
                                                )}
                                            </h3>
                                        </div>
                                        <div className="flex gap-1 shrink-0 ml-2">
                                            <Button
                                                variant={viewMode === 'details' ? 'default' : 'outline'}
                                                size="sm"
                                                className="h-8 px-2 text-xs"
                                                onClick={() => setViewMode('details')}
                                            >
                                                Details
                                            </Button>
                                            <Button
                                                variant={viewMode === 'payments' ? 'default' : 'outline'}
                                                size="sm"
                                                className="h-8 px-2 text-xs"
                                                onClick={() => setViewMode('payments')}
                                            >
                                                Payments
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <ScrollArea className="h-full p-6">
                                    {viewMode === 'details' ? (
                                        <div className="space-y-6">
                                            {/* Invoice Info */}
                                            <div>
                                                <h4 className="font-semibold mb-3">Invoice Information</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Invoice #:</span>
                                                        <span className="font-mono font-bold">#{selectedInvoice.invoiceNumber || selectedInvoice.id.split('-').pop()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Date:</span>
                                                        <span>{formatDate(selectedInvoice.createdAt)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Type:</span>
                                                        <Badge variant="outline" className="capitalize">{selectedInvoice.transactionType}</Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottle Details */}
                                            <div>
                                                <h4 className="font-semibold mb-3">Bottle Details</h4>
                                                <div className="p-4 rounded-lg border bg-muted/30">
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Bottle Type:</span>
                                                            <span className="font-medium">{selectedInvoice.bottleType}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Quantity:</span>
                                                            <span className="font-bold text-lg">{selectedInvoice.bottleCount}</span>
                                                        </div>
                                                        {onViewBottles && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full mt-2"
                                                                onClick={() => onViewBottles(selectedInvoice)}
                                                            >
                                                                <Package className="h-4 w-4 mr-2" />
                                                                View Bottle Details
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Financial Summary */}
                                            <div>
                                                <h4 className="font-semibold mb-3">Financial Summary</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Total Amount:</span>
                                                        <span className="font-bold">Rs. {selectedInvoice.totalAmount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Amount Paid:</span>
                                                        <span className="text-green-600 font-semibold">Rs. {selectedInvoice.amountPaid.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Credit Amount:</span>
                                                        <span className="text-red-600 font-semibold">Rs. {selectedInvoice.creditAmount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="pt-2 border-t flex justify-between">
                                                        <span className="font-semibold">Payment Status:</span>
                                                        {getStatusBadge(selectedInvoice.paymentStatus)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1"
                                                    onClick={() => {
                                                        const url = pdfService.getInvoiceUrl(selectedInvoice.id);
                                                        onPreview?.(url, `Invoice - ${selectedInvoice.invoiceNumber || selectedInvoice.id.split('-').pop()}`);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Preview
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="flex-1"
                                                    onClick={() => pdfService.downloadInvoice(selectedInvoice.id, selectedInvoice.invoiceNumber || selectedInvoice.id)}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Payment History */}
                                            <div>
                                                <h4 className="font-semibold mb-3">Payment History</h4>

                                                {/* Payment Summary */}
                                                <div className="grid grid-cols-3 gap-3 mb-4">
                                                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200">
                                                        <div className="text-xs text-green-700 dark:text-green-400 mb-1">Paid</div>
                                                        <div className="text-lg font-bold text-green-900 dark:text-green-100">
                                                            Rs. {selectedInvoice.amountPaid.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200">
                                                        <div className="text-xs text-red-700 dark:text-red-400 mb-1">Outstanding</div>
                                                        <div className="text-lg font-bold text-red-900 dark:text-red-100">
                                                            Rs. {selectedInvoice.creditAmount.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
                                                        <div className="text-xs text-blue-700 dark:text-blue-400 mb-1">Total</div>
                                                        <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                                            Rs. {selectedInvoice.totalAmount.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Payment Records */}
                                                <div className="space-y-2">
                                                    {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                                                        selectedInvoice.payments.map((payment, index) => (
                                                            <div key={payment.id} className="p-4 rounded-lg border bg-card">
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <div>
                                                                        <div className="font-semibold">Payment #{index + 1}</div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {formatDate(payment.paymentDate)}
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant={payment.paymentType === 'full' ? 'default' : 'secondary'}>
                                                                        {payment.paymentType}
                                                                    </Badge>
                                                                </div>
                                                                <div className="space-y-1 text-sm">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Amount:</span>
                                                                        <span className="font-bold text-green-600">Rs. {payment.amount.toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Method:</span>
                                                                        <span className="capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                                                                    </div>
                                                                    {payment.reference && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Reference:</span>
                                                                            <span className="font-mono text-xs">{payment.reference}</span>
                                                                        </div>
                                                                    )}
                                                                    {payment.notes && (
                                                                        <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                                                                            {payment.notes}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-8 text-muted-foreground">
                                                            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                            <p>No payment records found</p>
                                                            {selectedInvoice.paymentStatus === 'credit' && (
                                                                <p className="text-sm mt-2">This invoice is on credit</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <div className="text-center">
                                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-medium">Select an invoice</p>
                                    <p className="text-sm mt-2">Click on an invoice to view details</p>
                                    <p className="text-xs mt-1">Click on invoice number to view payment history</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
