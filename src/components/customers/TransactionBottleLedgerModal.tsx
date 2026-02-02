'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, Badge, ScrollArea } from '@/components/ui';
import { PackagePlus, PackageMinus, AlertTriangle, ArrowRight, Calendar } from 'lucide-react';

interface BottleLedgerEntry {
    id: string;
    bottleId: string;
    serialNumber: string;
    operationType: 'received' | 'issued' | 'returned' | 'filled' | 'damaged';
    previousStatus?: string;
    newStatus?: string;
    previousLocation?: string;
    newLocation?: string;
    customerName?: string;
    notes?: string;
    createdAt: string;
}

interface TransactionBottleLedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    transactionType: string;
    customerName: string;
    bottlesIn: BottleLedgerEntry[];
    bottlesOut: BottleLedgerEntry[];
}

export function TransactionBottleLedgerModal({
    isOpen,
    onClose,
    transactionId,
    transactionType,
    customerName,
    bottlesIn,
    bottlesOut,
}: TransactionBottleLedgerModalProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getOperationBadge = (operation: string) => {
        switch (operation) {
            case 'issued':
                return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50">Issued</Badge>;
            case 'returned':
                return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50">Returned</Badge>;
            case 'received':
                return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50">Received</Badge>;
            case 'filled':
                return <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50">Filled</Badge>;
            case 'damaged':
                return <Badge variant="destructive">Damaged</Badge>;
            default:
                return <Badge variant="outline">{operation}</Badge>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PackagePlus className="h-5 w-5 text-primary" />
                        Bottle Exchange Ledger - {transactionType.toUpperCase()}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        Customer: <span className="font-semibold">{customerName}</span> | Transaction: {transactionId.split('-').pop()}
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-6">
                        {/* Bottles IN (from customer to center) */}
                        {bottlesIn.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                                    <PackageMinus className="h-5 w-5 text-purple-600" />
                                    <h3 className="font-semibold text-lg">Bottles IN (Empty from Customer)</h3>
                                    <Badge variant="secondary">{bottlesIn.length}</Badge>
                                </div>
                                <div className="space-y-2">
                                    {bottlesIn.map((bottle) => (
                                        <div
                                            key={bottle.id}
                                            className="p-4 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-purple-900 dark:text-purple-100">
                                                            #{bottle.serialNumber}
                                                        </span>
                                                        {getOperationBadge(bottle.operationType)}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span className="capitalize">{bottle.previousStatus || 'with_customer'}</span>
                                                        <ArrowRight className="h-3 w-3" />
                                                        <span className="capitalize font-medium">{bottle.newStatus || 'empty'}</span>
                                                    </div>
                                                    {bottle.notes && (
                                                        <p className="text-sm text-muted-foreground mt-1">Note: {bottle.notes}</p>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(bottle.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bottles OUT (from center to customer) */}
                        {bottlesOut.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                                    <PackagePlus className="h-5 w-5 text-blue-600" />
                                    <h3 className="font-semibold text-lg">Bottles OUT (Filled to Customer)</h3>
                                    <Badge variant="secondary">{bottlesOut.length}</Badge>
                                </div>
                                <div className="space-y-2">
                                    {bottlesOut.map((bottle) => (
                                        <div
                                            key={bottle.id}
                                            className="p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-blue-900 dark:text-blue-100">
                                                            #{bottle.serialNumber}
                                                        </span>
                                                        {getOperationBadge(bottle.operationType)}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span className="capitalize">{bottle.previousStatus || 'filled'}</span>
                                                        <ArrowRight className="h-3 w-3" />
                                                        <span className="capitalize font-medium">{bottle.newStatus || 'with_customer'}</span>
                                                    </div>
                                                    {bottle.notes && (
                                                        <p className="text-sm text-muted-foreground mt-1">Note: {bottle.notes}</p>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(bottle.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        <div className="p-4 rounded-lg bg-muted/50 border">
                            <h4 className="font-semibold mb-2">Exchange Summary</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Empties Received:</span>
                                    <span className="ml-2 font-bold text-purple-600">{bottlesIn.length}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Filled Issued:</span>
                                    <span className="ml-2 font-bold text-blue-600">{bottlesOut.length}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Net Change:</span>
                                    <span className="ml-2 font-bold">
                                        {bottlesOut.length - bottlesIn.length > 0 ? '+' : ''}
                                        {bottlesOut.length - bottlesIn.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {bottlesIn.length === 0 && bottlesOut.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No bottle exchange data available for this transaction</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
