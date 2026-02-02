'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Alert, AlertDescription, AlertTitle, ScrollArea } from '@/components/ui';
import { BottleType, OxygenBottle } from '@/types';
import { Droplets, FlaskConical, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FillBottlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFill: (bottleIds: string[], bottleType: string, kgUsed: number) => void;
  emptyBottles: OxygenBottle[];
  bottleTypes: BottleType[];
  tankLevel: number; // in KG
}

export function FillBottlesModal({
  isOpen,
  onClose,
  onFill,
  emptyBottles,
  bottleTypes,
  tankLevel,
}: FillBottlesModalProps) {
  const [selectedBottles, setSelectedBottles] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');

  const filteredBottles = selectedType
    ? emptyBottles.filter((b) => b.bottleTypeId === selectedType)
    : emptyBottles;

  const totalKgNeeded = selectedBottles.reduce((sum, id) => {
    const bottle = emptyBottles.find((b) => b.id === id);
    if (!bottle) return sum;

    // Find matching type based on bottle's bottleTypeId or capacity
    const type = bottleTypes.find((t) => t.id === bottle.bottleTypeId)
      || bottleTypes.find((t) => t.capacityLiters === bottle.capacityLiters);

    return sum + (type?.refillKg || (bottle.capacityLiters * 0.2)); // Fallback to 0.2kg/L
  }, 0);

  const canFill = totalKgNeeded <= tankLevel;

  const handleToggleBottle = (id: string) => {
    setSelectedBottles((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    // Select all that fit in remaining tank level
    let currentSum = 0;
    const availableIds: string[] = [];

    for (const bottle of filteredBottles) {
      const type = bottleTypes.find((t) => t.id === bottle.bottleTypeId)
        || bottleTypes.find((t) => t.capacityLiters === bottle.capacityLiters);
      const kg = type?.refillKg || (bottle.capacityLiters * 0.2);

      if (currentSum + kg <= tankLevel) {
        currentSum += kg;
        availableIds.push(bottle.id);
      }
    }
    setSelectedBottles(availableIds);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBottles.length > 0 && canFill) {
      const typeName = selectedType
        ? bottleTypes.find((t) => t.id === selectedType)?.name || 'Mixed'
        : 'Mixed';
      onFill(selectedBottles, typeName, totalKgNeeded);
      setSelectedBottles([]);
      setSelectedType('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Fill Empty Bottles
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl border border-cyan-200 dark:border-cyan-900 border-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-cyan-600" />
              <span className="text-cyan-700 dark:text-cyan-300 font-bold uppercase tracking-wider">Tank Available:</span>
            </div>
            <Badge variant="secondary" className="text-xl font-black px-4 py-1">
              {tankLevel.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Filter by Bottle Category</Label>
            <Select
              value={selectedType || "all"}
              onValueChange={(value) => {
                setSelectedType(value === "all" ? "" : value);
                setSelectedBottles([]);
              }}
            >
              <SelectTrigger className="h-12 border-2 hover:border-primary transition-colors">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Category</SelectItem>
                {bottleTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} (Refill: {type.refillKg}kg)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-muted-foreground">
              {filteredBottles.length} empty bottles in queue
            </span>
            <Button type="button" variant="outline" size="sm" onClick={handleSelectAll} className="font-bold border-2">
              Auto-Select Max
            </Button>
          </div>

          <ScrollArea className="h-72 rounded-xl border-2 bg-slate-50 dark:bg-slate-900/50 p-3 shadow-inner">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
              {filteredBottles.map((bottle) => {
                const type = bottleTypes.find((t) => t.id === bottle.bottleTypeId)
                  || bottleTypes.find((t) => t.capacityLiters === bottle.capacityLiters);
                return (
                  <label
                    key={bottle.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${selectedBottles.includes(bottle.id)
                      ? 'bg-primary/5 border-primary shadow-md scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBottles.includes(bottle.id)}
                      onChange={() => handleToggleBottle(bottle.id)}
                      className="sr-only"
                    />
                    <div className={`flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-colors ${selectedBottles.includes(bottle.id)
                      ? 'bg-primary border-primary text-white shadow-sm'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                      }`}>
                      {selectedBottles.includes(bottle.id) && <Check className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate leading-tight">{bottle.serialNumber}</p>
                      <p className="text-[10px] font-black uppercase text-orange-500">{type?.refillKg || '?'} kg</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{bottle.capacityLiters}L Tank</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </ScrollArea>

          <div className={`p-5 rounded-2xl border-2 shadow-sm ${canFill
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 shadow-emerald-100/50 dark:shadow-none'
            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 shadow-rose-100/50 dark:shadow-none'}`}>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className={cn('text-xs font-black uppercase tracking-widest', canFill ? 'text-emerald-600' : 'text-rose-600')}>
                  Filling Batch
                </span>
                <span className="text-2xl font-black tracking-tight mt-1">
                  {selectedBottles.length} Bottles
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-black uppercase tracking-widest text-muted-foreground">Oxygen Charge</span>
                <span className={cn('text-3xl font-black tabular-nums', canFill ? 'text-emerald-600' : 'text-rose-600')}>
                  {totalKgNeeded.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm">kg</span>
                </span>
              </div>
            </div>
            {!canFill && (
              <Alert variant="destructive" className="mt-4 border-2 shadow-lg">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="font-bold">Tank Supply Insufficient</AlertTitle>
                <AlertDescription className="font-medium">
                  Refilling these bottles requires {totalKgNeeded.toFixed(1)}kg but only {tankLevel.toFixed(1)}kg is available.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex gap-4 mt-8">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">
              Cancel
            </Button>
            <Button type="submit" disabled={!canFill || selectedBottles.length === 0} className="flex-1 h-12 gap-2 text-lg font-black shadow-xl">
              <FlaskConical className="h-5 w-5" />
              CONFIRM FILL
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
