'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Alert, AlertDescription, ScrollArea } from '@/components/ui';
import { BottleType, OxygenBottle } from '@/types';
import { Droplets, FlaskConical, AlertTriangle, Check } from 'lucide-react';

interface FillBottlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFill: (bottleIds: string[], bottleType: string, litersUsed: number) => void;
  emptyBottles: OxygenBottle[];
  bottleTypes: BottleType[];
  tankLevel: number;
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
    ? emptyBottles.filter((b) => {
        const type = bottleTypes.find((t) => t.id === selectedType);
        return type && b.capacityLiters === type.capacityLiters;
      })
    : emptyBottles;

  const totalLitersNeeded = selectedBottles.reduce((sum, id) => {
    const bottle = emptyBottles.find((b) => b.id === id);
    return sum + (bottle?.capacityLiters || 0);
  }, 0);

  const canFill = totalLitersNeeded <= tankLevel;

  const handleToggleBottle = (id: string) => {
    setSelectedBottles((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const availableIds = filteredBottles
      .filter((b) => {
        const wouldTotal =
          selectedBottles
            .filter((id) => !filteredBottles.find((fb) => fb.id === id))
            .reduce((sum, id) => {
              const bottle = emptyBottles.find((bt) => bt.id === id);
              return sum + (bottle?.capacityLiters || 0);
            }, 0) + filteredBottles.reduce((sum, bt) => sum + bt.capacityLiters, 0);
        return wouldTotal <= tankLevel;
      })
      .map((b) => b.id);
    setSelectedBottles(availableIds);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBottles.length > 0 && canFill) {
      const typeName = selectedType
        ? bottleTypes.find((t) => t.id === selectedType)?.name || 'Mixed'
        : 'Mixed';
      onFill(selectedBottles, typeName, totalLitersNeeded);
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

        <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl border border-cyan-200 dark:border-cyan-900">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-cyan-600" />
              <span className="text-cyan-700 dark:text-cyan-300 font-medium">Tank Available:</span>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {tankLevel.toLocaleString()} L
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Filter by Bottle Type</Label>
            <Select
              value={selectedType || "all"}
              onValueChange={(value) => {
                setSelectedType(value === "all" ? "" : value);
                setSelectedBottles([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {bottleTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} ({type.capacityLiters}L)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {filteredBottles.length} empty bottles available
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
          </div>

          <ScrollArea className="h-64 rounded-xl border bg-muted/30 p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredBottles.map((bottle) => (
                <label
                  key={bottle.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                    selectedBottles.includes(bottle.id)
                      ? 'bg-primary/10 border-2 border-primary shadow-sm'
                      : 'bg-card border-2 border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedBottles.includes(bottle.id)}
                    onChange={() => handleToggleBottle(bottle.id)}
                    className="sr-only"
                  />
                  <div className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                    selectedBottles.includes(bottle.id)
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground/30'
                  }`}>
                    {selectedBottles.includes(bottle.id) && <Check className="h-3 w-3" />}
                  </div>
                  <div className="w-4 h-8 bg-gray-200 rounded-b-lg relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-gray-500 rounded-t" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{bottle.serialNumber}</p>
                    <p className="text-xs text-muted-foreground">{bottle.capacityLiters}L</p>
                  </div>
                </label>
              ))}
            </div>
          </ScrollArea>

          <div className={`p-4 rounded-xl border-2 ${canFill ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'}`}>
            <div className="flex justify-between items-center">
              <span className={canFill ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                Selected: {selectedBottles.length} bottles
              </span>
              <Badge variant={canFill ? 'default' : 'destructive'} className="text-lg font-bold">
                {totalLitersNeeded.toLocaleString()} L needed
              </Badge>
            </div>
            {!canFill && (
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Not enough oxygen in tank! Reduce selection or refill tank first.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={!canFill || selectedBottles.length === 0} className="flex-1 gap-2">
              <FlaskConical className="h-4 w-4" />
              Fill {selectedBottles.length} Bottles
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
