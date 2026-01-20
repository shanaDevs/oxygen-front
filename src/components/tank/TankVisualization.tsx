'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Droplets, Gauge, TrendingUp, AlertTriangle } from 'lucide-react';

interface TankVisualizationProps {
  capacity: number;
  currentLevel: number;
  previousLevel?: number;
  showAnimation?: boolean;
  label?: string;
}

export function TankVisualization({
  capacity,
  currentLevel,
  previousLevel,
  showAnimation = false,
  label = 'Main Tank',
}: TankVisualizationProps) {
  const [animatedLevel, setAnimatedLevel] = useState(previousLevel || currentLevel);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);

  const percentage = (animatedLevel / capacity) * 100;
  const refillAmount = previousLevel ? currentLevel - previousLevel : 0;

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
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl bg-gradient-to-br', config.gradient, 'shadow-lg', config.glow)}>
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{label}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <StatusIcon className={cn('h-3.5 w-3.5', config.text)} />
                <span className={cn('text-sm font-medium', config.text)}>{status.text}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tight">{animatedLevel.toFixed(0)} <span className="text-lg text-muted-foreground font-normal">L</span></p>
            <p className="text-sm text-muted-foreground">of {capacity.toLocaleString()} L</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Modern Tank visualization */}
        <div className="relative">
          <div className="relative w-full h-56 bg-gradient-to-b from-muted/30 to-muted/50 rounded-2xl overflow-hidden border-2 border-border shadow-inner">
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="absolute w-full border-t border-foreground" style={{ top: `${i * 10}%` }} />
              ))}
            </div>

            {/* Tank liquid */}
            <div
              className={cn('absolute bottom-0 left-0 right-0 bg-gradient-to-t transition-all duration-500', config.gradient)}
              style={{ height: `${percentage}%` }}
            >
              {/* Glossy overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10" />
              
              {/* Wave effect */}
              <div className="absolute top-0 left-0 right-0 h-6 overflow-hidden">
                <svg
                  className="absolute w-[200%] animate-wave"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,6 Q25,0 50,6 T100,6 T150,6 T200,6 V12 H0 Z"
                    fill="rgba(255,255,255,0.25)"
                  />
                </svg>
              </div>

              {/* Bubbles during animation */}
              {showBubbles && (
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-white/50 rounded-full animate-bubble"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 1}s`,
                        animationDuration: `${1 + Math.random() * 1}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Level markers */}
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/30"
                style={{ bottom: `${mark}%` }}
              >
                <Badge variant="secondary" className="absolute right-2 -top-3 text-[10px] h-5">
                  {((mark / 100) * capacity).toLocaleString()} L
                </Badge>
              </div>
            ))}

            {/* Tank label */}
            <div className="absolute top-3 left-3">
              <Badge className={cn('gap-1.5 font-semibold', config.badge)}>
                <Droplets className="h-3 w-3" />
                O₂ Tank
              </Badge>
            </div>

            {/* Percentage badge */}
            <div className="absolute top-3 right-3">
              <div className={cn('px-3 py-1.5 rounded-lg font-bold text-xl', config.badge)}>
                {percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Refill indicator */}
        {isAnimating && refillAmount > 0 && (
          <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-3 px-4 rounded-xl animate-pulse border border-emerald-200">
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">Filling: +{refillAmount.toLocaleString()} L</span>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 bg-muted/50 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Capacity</p>
            <p className="text-xl font-bold mt-1">{capacity.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Liters</p>
          </div>
          <div className={cn('text-center p-4 rounded-xl border border-border/50', config.badge)}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">Available</p>
            <p className="text-xl font-bold mt-1">{animatedLevel.toFixed(0)}</p>
            <p className="text-xs opacity-70">Liters</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Empty Space</p>
            <p className="text-xl font-bold mt-1">{(capacity - animatedLevel).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Liters</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fill Level</span>
            <span className="font-semibold">{percentage.toFixed(1)}%</span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>
      </CardContent>
    </Card>
  );
}
