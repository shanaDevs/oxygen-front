'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Progress } from '@/components/ui';
import { Fuel, Droplets, Banknote, AlertCircle } from 'lucide-react';

interface RefillTankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefill: (liters: number, supplierId: string, paymentInfo: {
    pricePerLiter: number;
    amountPaid: number;
    paymentStatus: 'full' | 'partial' | 'outstanding';
  }) => void;
  currentLevel: number;
  capacity: number;
  suppliers: { id: string; name: string }[];
}

export function RefillTankModal({
  isOpen,
  onClose,
  onRefill,
  currentLevel,
  capacity,
  suppliers,
}: RefillTankModalProps) {
  const [liters, setLiters] = useState<number>(0);
  const [supplierId, setSupplierId] = useState<string>('');
  const [pricePerLiter, setPricePerLiter] = useState<number>(40);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'full' | 'partial' | 'outstanding'>('full');

  const maxRefill = capacity - currentLevel;
  const totalAmount = liters * pricePerLiter;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (liters > 0 && supplierId) {
      onRefill(liters, supplierId, { pricePerLiter, amountPaid, paymentStatus });
      onClose();
    }
  };

  const handlePaymentStatusChange = (status: 'full' | 'partial' | 'outstanding') => {
    setPaymentStatus(status);
    if (status === 'full') {
      setAmountPaid(totalAmount);
    } else if (status === 'outstanding') {
      setAmountPaid(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            Refill Main Tank
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Liters to Add</span>
              <Badge variant="secondary">Max: {maxRefill.toLocaleString()} L</Badge>
            </Label>
            <Input
              type="number"
              value={liters || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLiters(Math.min(val, maxRefill));
                if (paymentStatus === 'full') {
                  setAmountPaid(val * pricePerLiter);
                }
              }}
              min={0}
              max={maxRefill}
              placeholder="Enter liters..."
            />
            <Progress value={(liters / maxRefill) * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <Label>Price per Liter (Rs.)</Label>
            <Input
              type="number"
              value={pricePerLiter || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPricePerLiter(val);
                if (paymentStatus === 'full') {
                  setAmountPaid(liters * val);
                }
              }}
              min={0}
              placeholder="40"
            />
          </div>

          <div className="p-4 bg-muted/50 rounded-xl border">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Total Amount
              </span>
              <span className="text-xl font-bold">Rs. {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Status</Label>
            <div className="flex gap-2">
              {(['full', 'partial', 'outstanding'] as const).map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={paymentStatus === status ? 'default' : 'outline'}
                  onClick={() => handlePaymentStatusChange(status)}
                  className={`flex-1 ${
                    paymentStatus === status
                      ? status === 'full'
                        ? 'bg-green-500 hover:bg-green-600'
                        : status === 'partial'
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-destructive hover:bg-destructive/90'
                      : ''
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {paymentStatus !== 'full' && (
            <div className="space-y-2">
              <Label>Amount Paid (Rs.)</Label>
              <Input
                type="number"
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                min={0}
                max={totalAmount}
              />
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                Outstanding: Rs. {(totalAmount - amountPaid).toLocaleString()}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={!liters || !supplierId} className="flex-1 gap-2">
              <Droplets className="h-4 w-4" />
              Refill Tank
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
