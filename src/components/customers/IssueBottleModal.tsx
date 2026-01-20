'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Separator } from '@/components/ui';
import { Customer, OxygenBottle, BottleType } from '@/types';
import { PackagePlus, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';

interface IssueBottleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssue: (data: {
    customerId: string;
    bottleIds: string[];
    totalAmount: number;
    amountPaid: number;
    paymentStatus: 'full' | 'partial' | 'credit';
  }) => void;
  filledBottles: OxygenBottle[];
  customers: Customer[];
  bottleTypes: BottleType[];
}

export function IssueBottleModal({
  isOpen,
  onClose,
  onIssue,
  filledBottles,
  customers,
  bottleTypes,
}: IssueBottleModalProps) {
  const [customerId, setCustomerId] = useState<string>('');
  const [selectedBottles, setSelectedBottles] = useState<string[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'full' | 'partial' | 'credit'>('full');

  const totalAmount = selectedBottles.reduce((sum, id) => {
    const bottle = filledBottles.find((b) => b.id === id);
    if (bottle) {
      const type = bottleTypes.find((t) => t.capacityLiters === bottle.capacityLiters);
      return sum + (type?.pricePerFill || 0);
    }
    return sum;
  }, 0);

  const handleToggleBottle = (id: string) => {
    setSelectedBottles((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handlePaymentStatusChange = (status: 'full' | 'partial' | 'credit') => {
    setPaymentStatus(status);
    if (status === 'full') {
      setAmountPaid(totalAmount);
    } else if (status === 'credit') {
      setAmountPaid(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerId && selectedBottles.length > 0) {
      onIssue({
        customerId,
        bottleIds: selectedBottles,
        totalAmount,
        amountPaid: paymentStatus === 'full' ? totalAmount : amountPaid,
        paymentStatus,
      });
      setCustomerId('');
      setSelectedBottles([]);
      setAmountPaid(0);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-green-500" />
            Issue Bottles to Customer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.totalCredit > 0 ? `(Credit: Rs. ${c.totalCredit})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Select Filled Bottles</span>
              <Badge variant="secondary">{filledBottles.length} available</Badge>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-muted/50 rounded-lg border">
              {filledBottles.map((bottle) => {
                const type = bottleTypes.find((t) => t.capacityLiters === bottle.capacityLiters);
                return (
                  <label
                    key={bottle.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedBottles.includes(bottle.id)
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                        : 'bg-card border-2 border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBottles.includes(bottle.id)}
                      onChange={() => handleToggleBottle(bottle.id)}
                      className="sr-only"
                    />
                    <div className="w-4 h-8 bg-linear-to-t from-green-400 to-green-200 dark:from-green-500 dark:to-green-300 rounded-b-lg relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-gray-500 rounded-t" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{bottle.serialNumber}</p>
                      <p className="text-xs text-muted-foreground">{bottle.capacityLiters}L - Rs. {type?.pricePerFill || 0}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center">
              <span className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Selected: {selectedBottles.length} bottles
              </span>
              <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                Rs. {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Status</Label>
            <div className="flex gap-2">
              {(['full', 'partial', 'credit'] as const).map((status) => (
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
                  {status === 'full' ? 'Full Payment' : status === 'partial' ? 'Partial' : 'Credit'}
                </Button>
              ))}
            </div>
          </div>

          {paymentStatus !== 'full' && (
            <div className="space-y-2">
              <Label>Amount Received (Rs.)</Label>
              <Input
                type="number"
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                min={0}
                max={totalAmount}
              />
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                Credit Amount: Rs. {(totalAmount - amountPaid).toLocaleString()}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={!customerId || selectedBottles.length === 0} className="flex-1 gap-2 bg-green-500 hover:bg-green-600">
              <PackagePlus className="h-4 w-4" />
              Issue Bottles
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
