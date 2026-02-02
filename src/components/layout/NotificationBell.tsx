'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationService } from '@/services';
import { Notification } from '@/types';
import {
    Bell,
    Droplets,
    Package,
    CreditCard,
    Receipt,
    AlertTriangle,
    CheckCircle2,
    Clock,
    RefreshCw,
    X,
} from 'lucide-react';

const notificationIcons: Record<string, React.ElementType> = {
    tank_low: Droplets,
    tank_critical: AlertTriangle,
    bottle_issue: Package,
    bottle_return: Package,
    payment_received: CreditCard,
    payment_due: CreditCard,
    sale_complete: Receipt,
    refill_complete: CheckCircle2,
    system: Bell,
};

const priorityColors: Record<string, string> = {
    low: 'bg-gray-400',
    medium: 'bg-blue-500',
    high: 'bg-amber-500',
    critical: 'bg-destructive',
};

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await notificationService.getUnread(10);
            if (response.success && response.data) {
                setNotifications(response.data.notifications || []);
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            // Fallback to empty
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        Notifications
                        {loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </span>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {unreadCount} new
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={fetchNotifications}
                        >
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No new notifications</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[300px]">
                        {notifications.map((notification) => {
                            const Icon = notificationIcons[notification.type] || Bell;
                            const priorityColor = priorityColors[notification.priority] || 'bg-gray-400';

                            return (
                                <div
                                    key={notification.id}
                                    className="group relative flex gap-3 px-3 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border last:border-0"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                >
                                    <div className={`mt-0.5 p-1.5 rounded-full ${priorityColor}/10`}>
                                        <Icon className={`h-4 w-4 ${notification.priority === 'critical' ? 'text-destructive' : notification.priority === 'high' ? 'text-amber-500' : 'text-primary'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-sm leading-tight truncate">
                                                {notification.title}
                                            </p>
                                            <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${priorityColor}`} />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(notification.createdAt)}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkAsRead(notification.id);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            );
                        })}
                    </ScrollArea>
                )}

                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="flex gap-2 p-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={handleMarkAllAsRead}
                            >
                                Mark all as read
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => {
                                    setOpen(false);
                                    // Navigate to notifications page if needed
                                }}
                            >
                                View all
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
