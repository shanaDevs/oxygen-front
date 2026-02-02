'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationBell } from './NotificationBell';
import {
  Search,
  HelpCircle,
  Calendar,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 bg-card/80 backdrop-blur-lg border-b border-border px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Search - hidden on mobile, shown on larger screens */}
      <div className="hidden sm:flex items-center gap-4 flex-1 max-w-xl pl-0 lg:pl-0">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search customers, bottles, suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Mobile: Logo placeholder */}
      <div className="sm:hidden pl-12">
        <span className="font-semibold text-primary">OxygenPOS</span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Mobile Search Button */}
        <Button variant="ghost" size="icon" className="h-9 w-9 sm:hidden">
          <Search className="h-4 w-4" />
        </Button>

        {/* Date - hidden on smaller screens */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications - Now using the new component */}
        <NotificationBell />

        {/* Help - hidden on mobile */}
        <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:flex">
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  AD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">Admin User</span>
                <span className="text-xs text-muted-foreground">admin@oxygenpos.com</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer text-destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
