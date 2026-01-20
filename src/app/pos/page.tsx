'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  LoadingSpinner,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  ScrollArea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui';
import { customerService, bottleService } from '@/services';
import { bottleTypes } from '@/data';
import { Customer, OxygenBottle, BottleType } from '@/types';
import { cn } from '@/lib/utils';
import {
  ShoppingCart,
  User,
  Package,
  CreditCard,
  Banknote,
  Receipt,
  X,
  CheckCircle2,
  AlertTriangle,
  Container,
  Plus,
} from 'lucide-react';

interface CartItem {
  bottleId: string;
  serialNumber: string;
  bottleType: BottleType;
  price: number;
}

export default function POSPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bottles, setBottles] = useState<OxygenBottle[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'partial'>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [custs, btls] = await Promise.all([
        customerService.getAll(),
        bottleService.getAll(),
      ]);
      setCustomers(custs);
      setBottles(btls);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filledBottles = bottles.filter((b) => b.status === 'filled');
  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer);

  const filteredBottles = selectedType === 'all' 
    ? filledBottles 
    : filledBottles.filter(b => b.capacityLiters.toString() === selectedType);

  const addToCart = (bottle: OxygenBottle) => {
    if (cart.find((item) => item.bottleId === bottle.id)) return;

    const type = bottleTypes.find((t) => t.capacityLiters === bottle.capacityLiters);
    if (!type) return;

    setCart((prev) => [
      ...prev,
      {
        bottleId: bottle.id,
        serialNumber: bottle.serialNumber,
        bottleType: type,
        price: type.pricePerFill,
      },
    ]);
  };

  const removeFromCart = (bottleId: string) => {
    setCart((prev) => prev.filter((item) => item.bottleId !== bottleId));
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const creditAmount = paymentMethod === 'cash' ? 0 : total - amountPaid;

  const handleCheckout = async () => {
    if (!selectedCustomer || cart.length === 0) return;

    const bottleIds = cart.map(item => item.bottleId);
    const paymentStatus = paymentMethod === 'cash' ? 'full' : paymentMethod === 'credit' ? 'credit' : 'partial';

    // Optimistic UI update
    setBottles((prev) =>
      prev.map((bottle) =>
        cart.find((item) => item.bottleId === bottle.id)
          ? {
              ...bottle,
              status: 'with_customer' as const,
              customerId: selectedCustomer,
              customerName: selectedCustomerData?.name,
              issuedDate: new Date().toISOString(),
            }
          : bottle
      )
    );

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === selectedCustomer
          ? {
              ...c,
              bottlesInHand: c.bottlesInHand + cart.length,
              totalCredit: c.totalCredit + creditAmount,
              loyaltyPoints: c.loyaltyPoints + Math.floor(amountPaid / 100),
            }
          : c
      )
    );

    // Call API
    try {
      await customerService.issueBottles({
        customerId: selectedCustomer,
        bottleIds,
        totalAmount: total,
        amountPaid,
        paymentStatus,
      });
    } catch (err) {
      console.error('Failed to sync with server:', err);
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCart([]);
      setSelectedCustomer('');
      setAmountPaid(0);
      setPaymentMethod('cash');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => fetchData()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Left side - Bottles */}
      <div className="flex-1 flex flex-col">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Quick Sale</h1>
              <p className="text-muted-foreground">Select bottles to issue to customer</p>
            </div>
          </div>
        </div>

        {/* Bottle Type Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button 
            variant={selectedType === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedType('all')}
            className="shrink-0"
          >
            All ({filledBottles.length})
          </Button>
          {bottleTypes.map((type) => {
            const count = filledBottles.filter(
              (b) => b.capacityLiters === type.capacityLiters
            ).length;
            return (
              <Button
                key={type.id}
                variant={selectedType === type.capacityLiters.toString() ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type.capacityLiters.toString())}
                className="shrink-0 gap-2"
              >
                <Container className="h-3.5 w-3.5" />
                {type.name}
                <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                <span className="text-primary font-semibold">Rs.{type.pricePerFill}</span>
              </Button>
            );
          })}
        </div>

        {/* Bottles Grid */}
        <Card className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {filteredBottles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Package className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">No filled bottles available</p>
                <p className="text-sm">Fill some bottles from the tank first</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredBottles
                  .filter((b) => !cart.find((item) => item.bottleId === b.id))
                  .map((bottle) => {
                    const type = bottleTypes.find(
                      (t) => t.capacityLiters === bottle.capacityLiters
                    );
                    return (
                      <button
                        key={bottle.id}
                        onClick={() => addToCart(bottle)}
                        className="group relative bg-card p-4 rounded-xl border-2 border-border hover:border-primary hover:shadow-lg transition-all text-left"
                      >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="p-1 rounded-full bg-primary text-primary-foreground">
                            <Plus className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-12 relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-muted-foreground rounded-t" />
                            <div className="absolute top-2 inset-x-0 bottom-0 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-b-lg shadow-inner" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold truncate">
                              {bottle.serialNumber}
                            </p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {bottle.capacityLiters}L
                            </Badge>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-primary">
                          Rs. {type?.pricePerFill || 0}
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Right side - Cart */}
      <Card className="w-96 flex flex-col shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Current Sale
          </CardTitle>
        </CardHeader>

        <Separator />

        {/* Customer Selection */}
        <div className="p-4 space-y-3">
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer
          </Label>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{c.name}</span>
                    {c.totalCredit > 0 && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Rs. {c.totalCredit}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCustomerData && selectedCustomerData.totalCredit > 0 && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Existing credit: Rs. {selectedCustomerData.totalCredit.toLocaleString()}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="h-10 w-10 mb-2 opacity-50" />
              <p className="font-medium">No bottles added</p>
              <p className="text-sm">Click on bottles to add</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.bottleId}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-10 relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-muted-foreground rounded-t" />
                      <div className="absolute top-1.5 inset-x-0 bottom-0 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-b-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.serialNumber}</p>
                      <p className="text-xs text-muted-foreground">{item.bottleType.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Rs. {item.price}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => removeFromCart(item.bottleId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Payment Section */}
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Bottles</span>
            <Badge variant="secondary" className="text-base px-3">{cart.length}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">Total</span>
            <span className="text-2xl font-bold text-primary">Rs. {total.toLocaleString()}</span>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'cash', label: 'Cash', icon: Banknote, color: 'emerald' },
              { value: 'partial', label: 'Partial', icon: CreditCard, color: 'amber' },
              { value: 'credit', label: 'Credit', icon: Receipt, color: 'red' },
            ].map((method) => (
              <Button
                key={method.value}
                variant={paymentMethod === method.value ? 'default' : 'outline'}
                className={cn(
                  'flex-col h-auto py-3 gap-1',
                  paymentMethod === method.value && method.color === 'emerald' && 'bg-emerald-600 hover:bg-emerald-700',
                  paymentMethod === method.value && method.color === 'amber' && 'bg-amber-600 hover:bg-amber-700',
                  paymentMethod === method.value && method.color === 'red' && 'bg-red-600 hover:bg-red-700'
                )}
                onClick={() => {
                  setPaymentMethod(method.value as 'cash' | 'partial' | 'credit');
                  if (method.value === 'cash') setAmountPaid(total);
                  else if (method.value === 'credit') setAmountPaid(0);
                }}
              >
                <method.icon className="h-4 w-4" />
                <span className="text-xs">{method.label}</span>
              </Button>
            ))}
          </div>

          {paymentMethod !== 'cash' && (
            <div className="space-y-2">
              <Label>Amount Received</Label>
              <Input
                type="number"
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(Math.min(Number(e.target.value), total))}
                max={total}
              />
              <div className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg">
                <span className="text-sm text-destructive font-medium">Credit Amount:</span>
                <span className="text-destructive font-bold">Rs. {creditAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleCheckout}
            disabled={!selectedCustomer || cart.length === 0}
            className="w-full h-12 text-base font-semibold gap-2"
            size="lg"
          >
            <CheckCircle2 className="h-5 w-5" />
            {paymentMethod === 'cash'
              ? `Complete Sale - Rs. ${total.toLocaleString()}`
              : `Complete with Rs. ${creditAmount.toLocaleString()} Credit`}
          </Button>
        </div>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl">Sale Complete!</DialogTitle>
              <DialogDescription className="text-base">
                {cart.length} bottles issued to {selectedCustomerData?.name}
              </DialogDescription>
            </DialogHeader>
            {creditAmount > 0 && (
              <Badge variant="destructive" className="mt-4 text-base px-4 py-1">
                Credit Added: Rs. {creditAmount.toLocaleString()}
              </Badge>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
