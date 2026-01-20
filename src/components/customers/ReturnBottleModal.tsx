'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Separator } from '@/components/ui';
import { Customer, OxygenBottle } from '@/types';
import { PackageMinus, Info } from 'lucide-react';

interface ReturnBottleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturn: (data: {
    customerId: string;
    bottleIds: string[];
  }) => void;
  customers: Customer[];
  bottlesWithCustomers: OxygenBottle[];
}

export function ReturnBottleModal({
  isOpen,
  onClose,
  onReturn,
  customers,
  bottlesWithCustomers,
}: ReturnBottleModalProps) {
  const [customerId, setCustomerId] = useState<string>('');
  const [selectedBottles, setSelectedBottles] = useState<string[]>([]);

  const customerBottles = bottlesWithCustomers.filter((b) => b.customerId === customerId);

  const handleToggleBottle = (id: string) => {
    setSelectedBottles((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedBottles(customerBottles.map((b) => b.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerId && selectedBottles.length > 0) {
      onReturn({
        customerId,
        bottleIds: selectedBottles,
      });
      setCustomerId('');
      setSelectedBottles([]);
      onClose();
    }
  };

  const customersWithBottles = customers.filter((c) =>
    bottlesWithCustomers.some((b) => b.customerId === c.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageMinus className="h-5 w-5 text-purple-500" />
            Return Bottles
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Customer Returning Bottles</Label>
            <Select value={customerId} onValueChange={(val) => { setCustomerId(val); setSelectedBottles([]); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                {customersWithBottles.map((c) => {
                  const bottleCount = bottlesWithCustomers.filter((b) => b.customerId === c.id).length;
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({bottleCount} bottles)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {customerId && customerBottles.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {customerBottles.length} bottles with this customer
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-muted/50 rounded-lg border">
                {customerBottles.map((bottle) => (
                  <label
                    key={bottle.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedBottles.includes(bottle.id)
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                        : 'bg-card border-2 border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBottles.includes(bottle.id)}
                      onChange={() => handleToggleBottle(bottle.id)}
                      className="sr-only"
                    />
                    <div className="w-4 h-8 bg-linear-to-t from-blue-400 to-blue-200 dark:from-blue-500 dark:to-blue-300 rounded-b-lg relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-gray-500 rounded-t" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{bottle.serialNumber}</p>
                      <p className="text-xs text-muted-foreground">{bottle.capacityLiters}L</p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {customerId && customerBottles.length === 0 && (
            <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground border">
              No bottles found with this customer
            </div>
          )}

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <PackageMinus className="h-4 w-4" />
                Returning: {selectedBottles.length} bottles
              </span>
              <span className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Info className="h-4 w-4" />
                Will be marked as empty
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!customerId || selectedBottles.length === 0}
              className="flex-1 gap-2 bg-purple-500 hover:bg-purple-600"
            >
              <PackageMinus className="h-4 w-4" />
              Return {selectedBottles.length} Bottles
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
