'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, Badge, ScrollArea, Button } from '@/components/ui';
import { History, User, MapPin, Calendar, AlertTriangle, Package } from 'lucide-react';

interface BottleHistoryEntry {
    id: string;
    operationType: string;
    previousStatus?: string;
    newStatus?: string;
    previousLocation?: string;
    newLocation?: string;
    customerId?: string;
    customerName?: string;
    notes?: string;
    createdAt: string;
}

interface BottleHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    bottleSerialNumber: string;
    bottleCapacity: number;
    currentStatus: string;
    currentCustomer?: string;
    history: BottleHistoryEntry[];
}

export function BottleHistoryModal({
    isOpen,
    onClose,
    bottleSerialNumber,
    bottleCapacity,
    currentStatus,
    currentCustomer,
    history,
}: BottleHistoryModalProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getOperationIcon = (operation: string) => {
        switch (operation) {
            case 'issued':
                return '📤';
            case 'returned':
                return '📥';
            case 'filled':
                return '✅';
            case 'damaged':
                return '⚠️';
            case 'received':
                return '🔄';
            default:
                return '📋';
        }
    };

    const getOperationColor = (operation: string) => {
        switch (operation) {
            case 'issued':
                return 'text-blue-600 dark:text-blue-400';
            case 'returned':
                return 'text-purple-600 dark:text-purple-400';
            case 'filled':
                return 'text-green-600 dark:text-green-400';
            case 'damaged':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-muted-foreground';
        }
    };

    // Find last customer who had this bottle
    const lastCustomer = history
        .filter(h => h.customerName && (h.operationType === 'issued' || h.operationType === 'returned'))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Bottle History - #{bottleSerialNumber}
                    </DialogTitle>
                    <div className="flex flex-wrap gap-4 text-sm mt-2">
                        <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Capacity:</span>
                            <Badge variant="outline">{bottleCapacity}L</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant={currentStatus === 'damaged' ? 'destructive' : 'default'}>
                                {currentStatus.replace('_', ' ')}
                            </Badge>
                        </div>
                        {currentCustomer && (
                            <div className="flex items-center gap-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Current:</span>
                                <span className="font-semibold">{currentCustomer}</span>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4">
                        {/* Last Customer Alert (for damaged bottles) */}
                        {currentStatus === 'damaged' && lastCustomer && (
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-amber-900 dark:text-amber-100">Last Customer</h4>
                                        <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                                            This bottle was last with <span className="font-bold">{lastCustomer.customerName}</span>
                                        </p>
                                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                            {formatDate(lastCustomer.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="relative">
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                            {history.length > 0 ? (
                                <div className="space-y-4">
                                    {history.map((entry, index) => (
                                        <div key={entry.id} className="relative pl-14">
                                            <div className="absolute left-0 w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center text-xl">
                                                {getOperationIcon(entry.operationType)}
                                            </div>

                                            <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className={`font-semibold capitalize ${getOperationColor(entry.operationType)}`}>
                                                            {entry.operationType}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(entry.createdAt)}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        #{index + 1}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    {entry.customerName && (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-muted-foreground">Customer:</span>
                                                            <span className="font-medium">{entry.customerName}</span>
                                                        </div>
                                                    )}

                                                    {(entry.previousStatus || entry.newStatus) && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-muted-foreground">Status:</span>
                                                            {entry.previousStatus && (
                                                                <Badge variant="outline" className="text-xs capitalize">
                                                                    {entry.previousStatus.replace('_', ' ')}
                                                                </Badge>
                                                            )}
                                                            {entry.previousStatus && entry.newStatus && (
                                                                <span className="text-muted-foreground">→</span>
                                                            )}
                                                            {entry.newStatus && (
                                                                <Badge className="text-xs capitalize">
                                                                    {entry.newStatus.replace('_', ' ')}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}

                                                    {(entry.previousLocation || entry.newLocation) && (
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-muted-foreground">Location:</span>
                                                            {entry.previousLocation && (
                                                                <Badge variant="outline" className="text-xs capitalize">
                                                                    {entry.previousLocation}
                                                                </Badge>
                                                            )}
                                                            {entry.previousLocation && entry.newLocation && (
                                                                <span className="text-muted-foreground">→</span>
                                                            )}
                                                            {entry.newLocation && (
                                                                <Badge className="text-xs capitalize">
                                                                    {entry.newLocation}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}

                                                    {entry.notes && (
                                                        <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                                                            {entry.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No history available for this bottle</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={onClose} variant="outline">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
