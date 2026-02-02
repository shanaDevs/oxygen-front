'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Droplets,
  Factory,
  Users,
  Container,
  ShoppingCart,
  History,
  Settings,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/tank', label: 'Tank Management', icon: Droplets },
  { href: '/suppliers', label: 'Suppliers', icon: Factory },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/bottles', label: 'Bottles', icon: Container },
  { href: '/pos', label: 'Quick Sale', icon: ShoppingCart },
  { href: '/bottle-types', label: 'Bottle Types', icon: Container },
  { href: '/sales', label: 'Sales History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              OxygenPOS
            </h1>
            <p className="text-xs text-muted-foreground">Refilling Center</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 h-11 px-4 font-medium transition-all',
                    isActive && 'bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 text-primary" />}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User Profile */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src="/avatar.png" />
            <AvatarFallback className="bg-linear-to-br from-cyan-500 to-blue-600 text-white text-sm font-bold">
              CA
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Center Admin</p>
            <p className="text-xs text-muted-foreground truncate">admin@oxygen.com</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button - Fixed position */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden h-10 w-10 bg-card shadow-lg"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Sidebar - Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Access all pages of the Oxygen POS system</SheetDescription>
          </SheetHeader>
          <div className="h-full flex flex-col">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - Fixed */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border min-h-screen flex-col fixed left-0 top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
