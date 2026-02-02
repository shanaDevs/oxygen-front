'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Droplets, Gauge, TrendingUp, AlertTriangle } from 'lucide-react';

interface TankVisualizationProps {
  capacity: number; // in KG
  currentLevel: number; // in KG
  previousLevel?: number; // in KG
  showAnimation?: boolean;
  label?: string;
  unit?: string; // Default to kg
}

export function TankVisualization({
  capacity,
  currentLevel,
  previousLevel,
  showAnimation = false,
  label = 'Main Tank',
  unit = 'kg',
}: TankVisualizationProps) {
  const [animatedLevel, setAnimatedLevel] = useState(previousLevel || currentLevel);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);

  const percentage = capacity > 0 ? (animatedLevel / capacity) * 100 : 0;
  const refillAmount = previousLevel ? currentLevel - previousLevel : 0;

  // Convert kg to tons
  const animatedTons = animatedLevel / 1000;
  const capacityTons = capacity / 1000;

  useEffect(() => {
    if (showAnimation && previousLevel !== undefined && previousLevel < currentLevel) {
      setIsAnimating(true);
      setShowBubbles(true);

      const duration = 2000;
      const startTime = Date.now();
      const startLevel = previousLevel;
      const endLevel = currentLevel;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const newLevel = startLevel + (endLevel - startLevel) * easeOutCubic;

        setAnimatedLevel(newLevel);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setTimeout(() => setShowBubbles(false), 500);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setAnimatedLevel(currentLevel);
    }
  }, [showAnimation, previousLevel, currentLevel]);

  const getColorConfig = () => {
    if (percentage > 70) return {
      gradient: 'from-cyan-400 via-cyan-500 to-cyan-600',
      bg: 'bg-cyan-500',
      text: 'text-cyan-600',
      badge: 'bg-cyan-100 text-cyan-700',
      glow: 'shadow-cyan-500/30',
    };
    if (percentage > 40) return {
      gradient: 'from-amber-400 via-amber-500 to-amber-600',
      bg: 'bg-amber-500',
      text: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
      glow: 'shadow-amber-500/30',
    };
    return {
      gradient: 'from-red-400 via-red-500 to-red-600',
      bg: 'bg-red-500',
      text: 'text-red-600',
      badge: 'bg-red-100 text-red-700',
      glow: 'shadow-red-500/30',
    };
  };

  const config = getColorConfig();

  const getStatusText = () => {
    if (percentage > 70) return { text: 'Optimal', icon: Gauge };
    if (percentage > 40) return { text: 'Moderate', icon: TrendingUp };
    return { text: 'Low', icon: AlertTriangle };
  };

  const status = getStatusText();
  const StatusIcon = status.icon;

  return (
    <Card className="overflow-hidden border-2 shadow-xl">
      <CardHeader className="pb-2 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-3 rounded-2xl bg-gradient-to-br', config.gradient, 'shadow-lg', config.glow)}>
              <Droplets className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{label}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <StatusIcon className={cn('h-4 w-4', config.text)} />
                <span className={cn('text-sm font-bold uppercase tracking-wider', config.text)}>{status.text}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex flex-col items-end">
              <p className="text-3xl font-black tracking-tight flex items-baseline gap-1">
                {animatedLevel.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                <span className="text-base text-muted-foreground font-medium">{unit}</span>
              </p>
              <Badge variant="outline" className="mt-1 font-mono text-xs bg-white/50">
                {animatedTons.toFixed(3)} Tons
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="relative">
          <div className="relative w-full h-64 bg-gradient-to-b from-slate-100 dark:from-slate-900 to-slate-200 dark:to-slate-950 rounded-3xl overflow-hidden border-4 border-slate-300 dark:border-slate-800 shadow-2xl">
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="absolute w-full border-t border-slate-600" style={{ top: `${i * 10}%` }} />
              ))}
            </div>

            {/* Liquid */}
            <div
              className={cn('absolute bottom-0 left-0 right-0 bg-gradient-to-t transition-all duration-700 ease-out', config.gradient)}
              style={{ height: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/20" />
              <div className="absolute top-0 left-0 right-0 h-8 overflow-hidden">
                <svg
                  className="absolute w-[200%] animate-wave opacity-50"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,6 Q25,0 50,6 T100,6 T150,6 T200,6 V12 H0 Z"
                    fill="white"
                  />
                </svg>
              </div>

              {showBubbles && (
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(25)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-white/40 rounded-full animate-bubble"
                      style={{
                        left: `${Math.random() * 100}%`,
                        bottom: `${Math.random() * 20}%`,
                        animationDelay: `${Math.random() * 1.5}s`,
                        animationDuration: `${1 + Math.random() * 2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Percentage Marks */}
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                className="absolute left-0 right-0 border-t-2 border-dashed border-slate-400/40"
                style={{ bottom: `${mark}%` }}
              >
                <div className="absolute right-3 -top-2 px-2 py-0.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded text-[9px] font-bold text-slate-500 shadow-sm border border-slate-200 dark:border-slate-800">
                  {((mark / 100) * capacity).toLocaleString()} {unit}
                </div>
              </div>
            ))}

            <div className="absolute top-4 left-4">
              <Badge className={cn('gap-1.5 px-3 py-1 text-xs font-bold shadow-md uppercase tracking-wider', config.badge)}>
                <Droplets className="h-3.5 w-3.5 rotate-180" />
                Oxygen Supply
              </Badge>
            </div>

            <div className="absolute bottom-6 right-6 flex flex-col items-end">
              <div className={cn('px-4 py-2 rounded-2xl font-black text-3xl shadow-xl border-2 backdrop-blur-md', config.badge, 'border-white/50')}>
                {percentage.toFixed(1)}%
              </div>
              <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/50 dark:bg-slate-900/50 px-2 py-1 rounded">
                Real-time Status
              </div>
            </div>
          </div>
        </div>

        {isAnimating && refillAmount > 0 && (
          <div className="flex items-center justify-between bg-emerald-500/10 text-emerald-700 py-4 px-5 rounded-2xl border-2 border-emerald-500/20 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-full text-white animate-bounce">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg italic tracking-tight uppercase">Replenishing Tank</span>
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold opacity-70 uppercase">Amount Received</span>
              <span className="text-2xl font-black">+{refillAmount.toLocaleString()} {unit}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">Total Capacity</p>
            <p className="text-xl font-black tracking-tight">{capacity.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-slate-400">{unit} ({capacityTons.toFixed(1)}T)</p>
          </div>
          <div className={cn('text-center p-4 rounded-2xl border-2 shadow-md group', config.badge, 'border-current/10')}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Current Available</p>
            <p className="text-xl font-black tracking-tight">{animatedLevel.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-[10px] font-bold opacity-70">{unit} ({animatedTons.toFixed(3)}T)</p>
          </div>
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 group-hover:text-red-500 transition-colors">Empty Space</p>
            <p className="text-xl font-black tracking-tight">{(capacity - animatedLevel).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-[10px] font-bold text-slate-400">{unit}</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Tank Saturation</span>
            <span className={cn('text-sm font-black px-2 py-0.5 rounded', config.badge)}>{percentage.toFixed(1)}% Full</span>
          </div>
          <Progress value={percentage} className="h-4 rounded-full border border-slate-200 shadow-inner" />
        </div>
      </CardContent>
    </Card>
  );
}
