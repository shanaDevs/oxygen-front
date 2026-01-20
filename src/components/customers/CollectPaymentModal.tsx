'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator } from '@/components/ui';
import { Customer } from '@/types';
import { Banknote, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollect: (data: {
    customerId: string;
    amount: number;
  }) => void;
  customers: Customer[];
}

export function CollectPaymentModal({
  isOpen,
  onClose,
  onCollect,
  customers,
}: CollectPaymentModalProps) {
  const [customerId, setCustomerId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const maxAmount = selectedCustomer?.totalCredit || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerId && amount > 0) {
      onCollect({
        customerId,
        amount: Math.min(amount, maxAmount),
      });
      setCustomerId('');
      setAmount(0);
      onClose();
    }
  };

  const handlePayFull = () => {
    setAmount(maxAmount);
  };

  const customersWithCredit = customers.filter((c) => c.totalCredit > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-500" />
            Collect Payment
          </DialogTitle>
        </DialogHeader>

        {customersWithCredit.length === 0 ? (
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-700 dark:text-green-300 font-medium">All customers have cleared their credit!</p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={(val) => { setCustomerId(val); setAmount(0); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customersWithCredit
                    .sort((a, b) => b.totalCredit - a.totalCredit)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} - Outstanding: Rs. {c.totalCredit.toLocaleString()}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomer && (
              <>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex justify-between items-center">
                    <span className="text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Outstanding Amount:
                    </span>
                    <span className="text-2xl font-bold text-red-700 dark:text-red-300">
                      Rs. {selectedCustomer.totalCredit.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Amount Received (Rs.)</Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={handlePayFull}
                      className="text-primary"
                    >
                      Pay Full Amount
                    </Button>
                  </div>
                  <Input
                    type="number"
                    value={amount || ''}
                    onChange={(e) => setAmount(Math.min(Number(e.target.value), maxAmount))}
                    min={0}
                    max={maxAmount}
                    placeholder="Enter amount..."
                  />
                </div>

                {amount > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 dark:text-green-300 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Remaining after payment:
                      </span>
                      <span className="text-xl font-bold text-green-700 dark:text-green-300">
                        Rs. {(maxAmount - amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            <Separator />

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!customerId || amount <= 0}
                className="flex-1 gap-2 bg-green-500 hover:bg-green-600"
              >
                <Banknote className="h-4 w-4" />
                Collect Rs. {amount.toLocaleString()}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
