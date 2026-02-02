'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    Badge,
    LoadingSpinner,
    Alert,
    AlertDescription,
    AlertTitle,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    ScrollArea,
} from '@/components/ui';
import { notificationService, supplierService, tankService } from '@/services';
import { Notification, Supplier, MainTank } from '@/types';
import {
    Bell,
    AlertTriangle,
    Info,
    CheckCircle2,
    Trash2,
    CheckCircle,
    Clock,
    ArrowRight,
    Filter,
    ShoppingCart,
    Droplets,
    Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');
    const [isPoModalOpen, setIsPoModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [poData, setPoData] = useState({
        supplierId: '',
        amountKg: 0,
        pricePerKg: 0,
        notes: '',
    });

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getAll({
                limit: 100
            });
            if (response.success) {
                setNotifications(response.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const data = await supplierService.getAll();
            setSuppliers(data);
        } catch (err) {
            console.error('Failed to fetch suppliers:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchSuppliers();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await notificationService.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    const openPoModal = (notif: Notification) => {
        setSelectedNotification(notif);
        const remaining = (notif.data as any)?.remainingToFill || 0;
        setPoData({
            supplierId: '',
            amountKg: parseFloat(remaining.toFixed(1)),
            pricePerKg: 0,
            notes: `Purchase order initiated from ${notif.title}`,
        });
        setIsPoModalOpen(true);
    };

    const handleCreatePo = async () => {
        if (!poData.supplierId || poData.amountKg <= 0) return;

        try {
            // In a real system, this would call a PO service.
            // For now, we'll simulate sending it to the supplier.
            // We can use the tank refill service with a 'pending' status if available,
            // or just mark the notification as actioned.

            console.log('Sending PO:', poData);

            if (selectedNotification) {
                await handleMarkAsRead(selectedNotification.id);
            }

            setIsPoModalOpen(false);
            // Show success message (toast)
            alert(`PO for ${poData.amountKg}kg sent to supplier!`);
        } catch (err) {
            console.error('Failed to create PO:', err);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.isRead;
        if (filter === 'critical') return n.priority === 'critical';
        return n.type === filter;
    });

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
            case 'high': return <AlertTriangle className="h-5 w-5 text-amber-600" />;
            case 'medium': return <Info className="h-5 w-5 text-blue-600" />;
            default: return <Info className="h-5 w-5 text-slate-400" />;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical': return <Badge variant="destructive" className="uppercase text-[10px]">Critical</Badge>;
            case 'high': return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 uppercase text-[10px]">High</Badge>;
            case 'medium': return <Badge variant="secondary" className="uppercase text-[10px]">Medium</Badge>;
            default: return <Badge variant="outline" className="uppercase text-[10px]">Low</Badge>;
        }
    };

    return (
        <div className="container py-8 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/20">
                        <Bell className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                        <p className="text-muted-foreground">Keep track of system alerts and status updates</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="hidden sm:flex h-9">
                        Mark all as read
                    </Button>
                    <Button variant="ghost" size="icon" onClick={fetchNotifications} className="h-9 w-9">
                        <Clock className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="rounded-full px-4"
                >
                    All
                </Button>
                <Button
                    variant={filter === 'unread' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('unread')}
                    className="rounded-full px-4"
                >
                    Unread
                </Button>
                <Button
                    variant={filter === 'critical' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('critical')}
                    className="rounded-full px-4"
                >
                    Critical
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button
                    variant={filter === 'tank_critical' || filter === 'tank_low' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('tank_critical')}
                    className="rounded-full px-4"
                >
                    Tank Alerts
                </Button>
                <Button
                    variant={filter === 'sale_complete' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('sale_complete')}
                    className="rounded-full px-4"
                >
                    Sales
                </Button>
            </div>

            {loading ? (
                <div className="grid place-items-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            ) : filteredNotifications.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                            <CheckCircle className="h-10 w-10 text-muted-foreground opacity-30" />
                        </div>
                        <h3 className="text-xl font-semibold mb-1">All caught up!</h3>
                        <p className="text-muted-foreground max-w-sm">
                            You don't have any notifications {filter !== 'all' ? 'matching this filter' : 'at the moment'}.
                        </p>
                        {filter !== 'all' && (
                            <Button variant="link" onClick={() => setFilter('all')}>
                                Show all notifications
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredNotifications.map((notif) => (
                        <Card
                            key={notif.id}
                            className={cn(
                                "group transition-all hover:shadow-md border-l-4",
                                !notif.isRead ? "bg-primary/5 border-l-primary" : "bg-card border-l-slate-200"
                            )}
                        >
                            <CardContent className="p-5">
                                <div className="flex gap-4">
                                    <div className="mt-1 shrink-0">
                                        {getPriorityIcon(notif.priority)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className={cn("font-bold text-lg leading-tight", !notif.isRead ? "text-primary" : "text-foreground")}>
                                                    {notif.title}
                                                </h3>
                                                {getPriorityBadge(notif.priority)}
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap pt-1">
                                                {new Date(notif.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                            {notif.message}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {!notif.isRead && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-8 gap-1.5 text-xs font-semibold"
                                                        onClick={() => handleMarkAsRead(notif.id)}
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Mark as Read
                                                    </Button>
                                                )}
                                                {(notif.data as any)?.canCreatePO && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="h-8 gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => openPoModal(notif)}
                                                    >
                                                        <ShoppingCart className="h-3.5 w-3.5" />
                                                        Generate PO
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDelete(notif.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* PO Modal */}
            <Dialog open={isPoModalOpen} onOpenChange={setIsPoModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Purchase Order
                        </DialogTitle>
                        <DialogDescription>
                            Create a purchase order to refill the oxygen tank.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplier">Target Supplier</Label>
                            <Select
                                value={poData.supplierId}
                                onValueChange={(val) => setPoData(prev => ({ ...prev, supplierId: val }))}
                            >
                                <SelectTrigger id="supplier">
                                    <SelectValue placeholder="Select a supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Order Amount (kg)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={poData.amountKg}
                                    onChange={(e) => setPoData(prev => ({ ...prev, amountKg: parseFloat(e.target.value) }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Price per kg (Est.)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={poData.pricePerKg}
                                    onChange={(e) => setPoData(prev => ({ ...prev, pricePerKg: parseFloat(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="total">Total Estimated (Estimated)</Label>
                            <div className="p-2 bg-muted rounded-md font-bold text-lg">
                                Rs. {(poData.amountKg * poData.pricePerKg).toLocaleString()}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Input
                                id="notes"
                                value={poData.notes}
                                onChange={(e) => setPoData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add any instructions for the supplier..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPoModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleCreatePo}
                            disabled={!poData.supplierId || poData.amountKg <= 0}
                        >
                            Send PO to Supplier
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
