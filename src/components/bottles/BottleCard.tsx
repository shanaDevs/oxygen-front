'use client';

import { OxygenBottle } from '@/types';
import { Card, Badge } from '@/components/ui';
import { CircleCheck, Circle, UserCircle } from 'lucide-react';

interface BottleCardProps {
  bottle: OxygenBottle;
  onClick?: (bottle: OxygenBottle) => void;
}

export function BottleCard({ bottle, onClick }: BottleCardProps) {
  const getStatusBadge = () => {
    switch (bottle.status) {
      case 'filled':
        return { variant: 'default' as const, className: 'bg-green-500', icon: CircleCheck, label: 'Filled' };
      case 'empty':
        return { variant: 'outline' as const, className: '', icon: Circle, label: 'Empty' };
      case 'with_customer':
        return { variant: 'secondary' as const, className: 'bg-blue-500 text-white', icon: UserCircle, label: 'Out' };
      default:
        return { variant: 'outline' as const, className: '', icon: Circle, label: 'Unknown' };
    }
  };

  const getBottleSize = () => {
    if (bottle.capacityLiters <= 10) return 'h-16';
    if (bottle.capacityLiters <= 20) return 'h-20';
    if (bottle.capacityLiters <= 40) return 'h-24';
    return 'h-28';
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <Card
      onClick={() => onClick?.(bottle)}
      className="relative p-3 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/50"
    >
      <div className="flex items-center gap-3">
        {/* Bottle visualization */}
        <div className={`relative w-8 ${getBottleSize()} shrink-0`}>
          <div className="absolute inset-x-0 top-0 h-2 bg-gray-600 rounded-t-sm mx-1" />
          <div className={`absolute inset-x-0 top-2 bottom-0 rounded-b-lg border-2 ${
            bottle.status === 'filled' 
              ? 'bg-linear-to-t from-cyan-400 to-cyan-200 border-cyan-500' 
              : bottle.status === 'with_customer'
              ? 'bg-linear-to-t from-blue-400 to-blue-200 border-blue-500'
              : 'bg-gray-200 border-gray-400'
          }`}>
            {bottle.status === 'filled' && (
              <div className="absolute inset-0 overflow-hidden rounded-b-lg">
                <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-white/50 rounded-full animate-float" style={{ animationDelay: '0s' }} />
                <div className="absolute bottom-1 left-1/4 w-0.5 h-0.5 bg-white/50 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className="h-3.5 w-3.5" />
            <span className="font-medium text-sm truncate">{bottle.serialNumber}</span>
          </div>
          <Badge variant={status.variant} className={`text-xs ${status.className}`}>
            {bottle.capacityLiters}L • {status.label}
          </Badge>
          {bottle.status === 'with_customer' && bottle.customerName && (
            <p className="text-xs mt-1.5 text-muted-foreground truncate">{bottle.customerName}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
