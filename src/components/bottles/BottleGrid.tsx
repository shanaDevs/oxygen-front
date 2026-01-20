'use client';

import { OxygenBottle } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { CircleCheck, Circle, UserCircle } from 'lucide-react';

interface BottleGridProps {
  bottles: OxygenBottle[];
  onBottleClick?: (bottle: OxygenBottle) => void;
  filter?: 'all' | 'empty' | 'filled' | 'with_customer';
}

export function BottleGrid({ bottles, onBottleClick, filter = 'all' }: BottleGridProps) {
  const filteredBottles = filter === 'all' 
    ? bottles 
    : bottles.filter(b => b.status === filter);

  const groupedBottles = filteredBottles.reduce((acc, bottle) => {
    if (!acc[bottle.capacityLiters]) {
      acc[bottle.capacityLiters] = [];
    }
    acc[bottle.capacityLiters].push(bottle);
    return acc;
  }, {} as Record<number, OxygenBottle[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'from-green-400 to-green-500';
      case 'empty':
        return 'from-gray-300 to-gray-400';
      case 'with_customer':
        return 'from-blue-400 to-blue-500';
      default:
        return 'from-gray-300 to-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled':
        return <CircleCheck className="h-3 w-3 text-green-600" />;
      case 'empty':
        return <Circle className="h-3 w-3 text-gray-500" />;
      case 'with_customer':
        return <UserCircle className="h-3 w-3 text-blue-600" />;
      default:
        return <Circle className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedBottles)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([capacity, bottles]) => (
          <Card key={capacity}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{capacity}L Bottles</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="default" className="bg-green-500">
                    {bottles.filter(b => b.status === 'filled').length} filled
                  </Badge>
                  <Badge variant="outline">
                    {bottles.filter(b => b.status === 'empty').length} empty
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-500 text-white">
                    {bottles.filter(b => b.status === 'with_customer').length} out
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {bottles.map((bottle) => (
                  <div
                    key={bottle.id}
                    onClick={() => onBottleClick?.(bottle)}
                    className={`relative group cursor-pointer p-2 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-105 ${
                      bottle.status === 'filled'
                        ? 'border-green-300 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50'
                        : bottle.status === 'with_customer'
                        ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50'
                        : 'border-border bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    {/* Mini bottle visual */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-6 h-12">
                        {/* Valve */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1.5 bg-gray-500 rounded-t" />
                        {/* Body */}
                        <div
                          className={`absolute top-1.5 inset-x-0 bottom-0 rounded-b-lg bg-linear-to-t ${getStatusColor(bottle.status)}`}
                        >
                          {bottle.status === 'filled' && (
                            <div className="absolute inset-0 overflow-hidden rounded-b-lg opacity-50">
                              <div className="absolute bottom-1 left-1/2 w-1 h-1 bg-white rounded-full animate-ping" />
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="mt-1">{getStatusIcon(bottle.status)}</span>
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {bottle.serialNumber}
                      {bottle.customerName && <div className="text-primary">{bottle.customerName}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
