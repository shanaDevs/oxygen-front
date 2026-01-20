import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'cyan' | 'green' | 'purple' | 'orange' | 'red' | 'blue';
  description?: string;
}

const colorConfig = {
  cyan: {
    bg: 'bg-cyan-500/10',
    icon: 'text-cyan-600',
    gradient: 'from-cyan-500 to-cyan-600',
  },
  green: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-600',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  purple: {
    bg: 'bg-violet-500/10',
    icon: 'text-violet-600',
    gradient: 'from-violet-500 to-violet-600',
  },
  orange: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-600',
    gradient: 'from-amber-500 to-amber-600',
  },
  red: {
    bg: 'bg-red-500/10',
    icon: 'text-red-600',
    gradient: 'from-red-500 to-red-600',
  },
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
  },
};

export function StatCard({ title, value, icon: Icon, trend, color = 'cyan', description }: StatCardProps) {
  const config = colorConfig[color];

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-card">
      <div className={cn('absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 bg-gradient-to-br', config.gradient)} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center gap-1.5">
                <Badge 
                  variant="secondary"
                  className={cn(
                    'gap-1 font-medium',
                    trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(trend.value)}%
                </Badge>
                <span className="text-xs text-muted-foreground">vs yesterday</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', config.bg)}>
            <Icon className={cn('h-6 w-6', config.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
