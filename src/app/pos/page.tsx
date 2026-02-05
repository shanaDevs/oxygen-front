'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
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
  Alert,
  AlertDescription,
  AlertTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { customerService, bottleService, bottleTypeService, salesService, pdfService } from '@/services';
import { Customer, OxygenBottle, BottleType, SaleItem } from '@/types';
import { cn, isValidSriLankanPhone } from '@/lib/utils';
import {
  ShoppingCart,
  User,
  Package,
  CreditCard,
  Banknote,
  Receipt,
  X,
  RotateCcw,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Container,
  Plus,
  FileText,
  Printer,
  RefreshCw,
  UserPlus,
  Search,
} from 'lucide-react';

interface CartItem {
  uid: string; // Unique ID for cart row
  bottleId?: string;
  serialNumber: string;
  bottleTypeId: string;
  bottleTypeName: string;
  capacityLiters: number;
  refillKg: number;
  price: number;
  returnLinkId?: string; // Link to corresponding return bottle
}

interface ReturnBottle {
  serialNumber: string;
  bottleTypeId: string;
  bottleTypeName: string;
  cartLinkUid?: string; // Link to corresponding cart item
}

export default function POSPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bottles, setBottles] = useState<OxygenBottle[]>([]);
  const [bottleTypes, setBottleTypes] = useState<BottleType[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'partial'>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [lastSale, setLastSale] = useState<{ saleId: string; invoiceNumber?: string; total: number; bottleCount: number; returnCount: number } | null>(null);

  // Quick add count state
  const [quickAddCount, setQuickAddCount] = useState<Record<string, number>>({});

  // Bottle search state
  const [bottleSearch, setBottleSearch] = useState('');

  // Return flow state
  const [returnedBottles, setReturnedBottles] = useState<ReturnBottle[]>([]);
  const [returnSerial, setReturnSerial] = useState('');
  const [returnTypeId, setReturnTypeId] = useState('');

  // New customer registration state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [custsRes, btlsRes, typesRes] = await Promise.all([
        customerService.getAll(),
        bottleService.getFilled(),
        bottleTypeService.getAll(),
      ]);

      setCustomers(custsRes);
      setBottles(btlsRes.data || []);
      setBottleTypes(typesRes.data || []);

      // Initialize quick add counts
      const initialCounts: Record<string, number> = {};
      (typesRes.data || []).forEach(t => initialCounts[t.id] = 1);
      setQuickAddCount(initialCounts);
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

  // Filter filled bottles available in center
  const filledBottles = useMemo(() =>
    bottles.filter((b) => b.status === 'filled' && b.location === 'center'),
    [bottles]
  );

  const selectedCustomerData = useMemo(() =>
    customers.find((c) => c.id === selectedCustomer),
    [customers, selectedCustomer]
  );

  const filteredBottles = useMemo(() => {
    let filtered = selectedType === 'all'
      ? filledBottles
      : filledBottles.filter(b => b.capacityLiters?.toString() === selectedType);
    
    if (bottleSearch.trim()) {
      const searchLower = bottleSearch.toLowerCase().trim();
      filtered = filtered.filter(b => 
        b.serialNumber?.toLowerCase().includes(searchLower) ||
        b.id.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [filledBottles, selectedType, bottleSearch]);

  // Auto-sync return bottle type based on cart items
  useEffect(() => {
    if (cart.length > 0 && !returnTypeId) {
      // Set return type to the first item's bottle type
      setReturnTypeId(cart[0].bottleTypeId);
    }
  }, [cart, returnTypeId]);

  // Get bottle type for a bottle
  const getBottleType = (bottle: OxygenBottle): BottleType | undefined => {
    if (bottle.bottleType) return bottle.bottleType;
    return bottleTypes.find(t =>
      t.id === bottle.bottleTypeId ||
      t.capacityLiters === bottle.capacityLiters
    );
  };

  const addToCart = (bottle: OxygenBottle) => {
    if (cart.find((item) => item.bottleId === bottle.id)) return;

    const type = getBottleType(bottle);
    if (!type) {
      console.warn('No bottle type found for bottle:', bottle.id);
      return;
    }

    const cartUid = `cart-${Date.now()}-${Math.random()}`;
    const returnId = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    setCart((prev) => [
      ...prev,
      {
        uid: cartUid,
        bottleId: bottle.id,
        serialNumber: bottle.serialNumber || '',
        bottleTypeId: type.id,
        bottleTypeName: type.name,
        capacityLiters: bottle.capacityLiters,
        refillKg: type.refillKg || 0,
        price: type.pricePerFill,
        returnLinkId: returnId,
      },
    ]);

    // Auto-add return entry for the same bottle type (without serial)
    setReturnedBottles(prev => [
      ...prev,
      {
        serialNumber: returnId,
        bottleTypeId: type.id,
        bottleTypeName: type.name,
        cartLinkUid: cartUid,
      }
    ]);
  };

  const addByType = (type: BottleType, count: number) => {
    const newItems: CartItem[] = [];
    const newReturns: ReturnBottle[] = [];
    
    for (let i = 0; i < count; i++) {
      const cartUid = `cart-${Date.now()}-${Math.random()}-${i}`;
      const returnId = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${i}`;
      
      newItems.push({
        uid: cartUid,
        serialNumber: '',
        bottleTypeId: type.id,
        bottleTypeName: type.name,
        capacityLiters: type.capacityLiters,
        refillKg: type.refillKg || 0,
        price: type.pricePerFill,
        returnLinkId: returnId,
      });
      
      // Auto-add return entry for each bottle
      newReturns.push({
        serialNumber: returnId,
        bottleTypeId: type.id,
        bottleTypeName: type.name,
        cartLinkUid: cartUid,
      });
    }
    setCart((prev) => [...prev, ...newItems]);
    setReturnedBottles((prev) => [...prev, ...newReturns]);
  };

  const updateCartItemSerial = (uid: string, serial: string) => {
    setCart(prev => prev.map(item => {
      if (item.uid === uid) {
        // If serial matches an existing available bottle, link it
        const matchedBottle = bottles.find(b => b.serialNumber === serial && b.status === 'filled');
        return {
          ...item,
          serialNumber: serial,
          bottleId: matchedBottle?.id || undefined
        };
      }
      return item;
    }));
  };

  const removeFromCart = (uid: string) => {
    // Find the cart item to get its linked return ID
    const cartItem = cart.find(item => item.uid === uid);
    
    setCart((prev) => prev.filter((item) => item.uid !== uid));
    
    // Also remove the linked return bottle if exists
    if (cartItem?.returnLinkId) {
      setReturnedBottles(prev => prev.filter(r => r.serialNumber !== cartItem.returnLinkId));
    }
  };

  const clearCart = () => {
    setCart([]);
    setReturnedBottles([]);
    setPaymentMethod('cash');
    setAmountPaid(0);
    setReturnTypeId('');
    setBottleSearch('');
  };

  const addReturn = () => {
    if (!returnSerial) return;

    // Check if already in returns
    if (returnedBottles.find(r => r.serialNumber === returnSerial)) {
      setReturnSerial('');
      return;
    }

    const type = bottleTypes.find(t => t.id === returnTypeId);

    setReturnedBottles(prev => [
      ...prev,
      {
        serialNumber: returnSerial,
        bottleTypeId: returnTypeId,
        bottleTypeName: type?.name || 'Unknown Type'
      }
    ]);
    setReturnSerial('');
  };

  const removeReturn = (serial: string) => {
    // Find the return bottle to get its linked cart UID
    const returnBottle = returnedBottles.find(r => r.serialNumber === serial);
    
    setReturnedBottles(prev => prev.filter(r => r.serialNumber !== serial));
    
    // Also remove the linked cart item if exists
    if (returnBottle?.cartLinkUid) {
      setCart(prev => prev.filter(item => item.uid !== returnBottle.cartLinkUid));
    }
  };

  const updateReturnSerial = (oldSerial: string, newSerial: string) => {
    setReturnedBottles(prev => prev.map(r => 
      r.serialNumber === oldSerial 
        ? { ...r, serialNumber: newSerial }
        : r
    ));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const total = subtotal; // Add tax/discount here if needed
  const creditAmount = paymentMethod === 'cash' ? 0 : Math.max(0, total - amountPaid);
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, amountPaid - total) : 0;

  // Update amount paid when switching to cash
  useEffect(() => {
    if (paymentMethod === 'cash') {
      setAmountPaid(total);
    } else if (paymentMethod === 'credit') {
      setAmountPaid(0);
    }
  }, [paymentMethod, total]);

  const handleCheckout = async () => {
    if (!selectedCustomer || cart.length === 0) return;

    setProcessing(true);

    try {
      // Build items array for sale
      const items = cart.map(item => ({
        bottleId: item.bottleId,
        serialNumber: item.serialNumber,
        bottleTypeId: item.bottleTypeId,
        bottleTypeName: item.bottleTypeName,
        capacityLiters: item.capacityLiters,
        refillKg: item.refillKg,
        price: item.price,
      }));

      // Create sale via API
      const response = await salesService.create({
        customerId: selectedCustomer,
        items: items as any, // Cast to any to bypass strict SaleItem interface mismatch if any
        bottleIds: cart.map(item => item.bottleId).filter((id): id is string => !!id),
        returnedBottles: returnedBottles.map(r => ({
          serialNumber: r.serialNumber,
          bottleTypeId: r.bottleTypeId || undefined
        })),
        paymentMethod,
        amountPaid: paymentMethod === 'cash' ? total : amountPaid,
      });

      if (response.success && response.data) {
        // Update local state - remove sold bottles
        setBottles((prev) =>
          prev.filter((bottle) => !cart.find((item) => item.bottleId === bottle.id))
        );

        // Update customer data
        const netChange = cart.length - returnedBottles.length;
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === selectedCustomer
              ? {
                ...c,
                bottlesInHand: Math.max(0, c.bottlesInHand + netChange),
                totalCredit: c.totalCredit + creditAmount,
                loyaltyPoints: (c.loyaltyPoints || 0) + Math.floor(amountPaid / 100),
              }
              : c
          )
        );

        // Store last sale info for success dialog
        setLastSale({
          saleId: response.data.id,
          invoiceNumber: response.data.invoiceNumber,
          total: response.data.total,
          bottleCount: cart.length,
          returnCount: returnedBottles.length
        });

        setShowSuccess(true);
      } else {
        throw new Error(response.message || 'Failed to create sale');
      }
    } catch (err) {
      console.error('Failed to complete sale:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRegisterCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;

    if (!isValidSriLankanPhone(newCustomer.phone)) {
      toast.error('Please enter a valid Sri Lankan phone number');
      return;
    }

    try {
      setIsRegistering(true);
      const created = await customerService.create(newCustomer);
      setCustomers(prev => [created, ...prev]);
      setSelectedCustomer(created.id);
      setShowRegisterModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      toast.success(`Customer ${created.name} registered and selected!`);
    } catch (err) {
      console.error('Failed to register customer:', err);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setCart([]);
    setReturnedBottles([]);
    setSelectedCustomer('');
    setAmountPaid(0);
    setPaymentMethod('cash');
    setLastSale(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-100px)] overflow-y-auto lg:overflow-hidden pb-4">
      {/* Left side - Bottles */}
      <div className="flex-1 flex flex-col min-w-0 h-fit lg:h-full">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">Quick Sale</h1>
                <p className="text-xs md:text-sm text-muted-foreground leading-tight">Select bottles by serial number to issue</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
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

        {/* Batch Add Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bottleTypes.map(type => (
            <Card key={type.id} className="overflow-hidden border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader className="p-3 pb-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-bold">{type.name}</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">Rs.{type.pricePerFill}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    className="h-9"
                    value={quickAddCount[type.id] || 1}
                    onChange={(e) => setQuickAddCount(prev => ({ ...prev, [type.id]: parseInt(e.target.value) || 1 }))}
                  />
                  <Button size="sm" className="gap-2 h-9" onClick={() => addByType(type, quickAddCount[type.id] || 1)}>
                    <Plus className="h-4 w-4" />
                    Add {quickAddCount[type.id] > 1 ? `(${quickAddCount[type.id]})` : ''}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Available: {filledBottles.filter(b => b.bottleTypeId === type.id).length} units
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottles Grid */}
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Individual Bottles</h2>
          <Separator className="flex-1" />
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <Input
              placeholder="Search by serial number..."
              value={bottleSearch}
              onChange={(e) => setBottleSearch(e.target.value)}
              className="pl-10 h-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {bottleSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setBottleSearch('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {bottleSearch && (
            <p className="text-xs text-muted-foreground mt-1">
              Found {filteredBottles.filter((b) => !cart.find((item) => item.bottleId === b.id)).length} bottles matching "{bottleSearch}"
            </p>
          )}
        </div>

        <Card className="flex-1 overflow-hidden flex flex-col min-h-[300px] lg:min-h-0 bg-transparent border-0 shadow-none">
          <ScrollArea className="h-full pr-4">
            {filteredBottles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-xl">
                <Package className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">No filled bottles available</p>
                <p className="text-sm text-center px-4">Fill some bottles from the tank first</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-2">
                {filteredBottles
                  .filter((b) => !cart.find((item) => item.bottleId === b.id))
                  .map((bottle) => {
                    const type = getBottleType(bottle);
                    const isInCart = cart.find((item) => item.bottleId === bottle.id);
                    return (
                      <button
                        key={bottle.id}
                        onClick={() => addToCart(bottle)}
                        disabled={isInCart !== undefined}
                        className={cn(
                          "group relative bg-card p-4 rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all text-left",
                          isInCart && "opacity-50 cursor-not-allowed"
                        )}
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
                              {bottle.serialNumber || 'No Serial'}
                            </p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {bottle.capacityLiters}L
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-primary">
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
      <Card className="w-full lg:w-[400px] shrink-0 flex flex-col shadow-xl overflow-hidden h-fit sm:h-[600px] lg:h-full border-l bg-card/50">
        <div className="flex flex-col h-full bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
          <CardHeader className="pb-3 pt-4 px-4 shrink-0 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5" />
                Current Sale
              </CardTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-xs h-7">
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>

          {/* Customer Selection */}
          <div className="p-4 space-y-3 bg-muted/20 shrink-0 border-b">
            <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Customer
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{c.name}</span>
                          {c.totalCredit > 0 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Rs. {c.totalCredit.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-10 w-10 border-dashed border-primary/40 hover:border-primary text-primary"
                onClick={() => setShowRegisterModal(true)}
                title="Register New Customer"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            {selectedCustomerData && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Bottles: {selectedCustomerData.bottlesInHand}
                </span>
                <span className="text-muted-foreground">
                  Points: {selectedCustomerData.loyaltyPoints || 0}
                </span>
              </div>
            )}
            {selectedCustomerData && selectedCustomerData.totalCredit > 0 && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded-lg text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Outstanding: Rs. {selectedCustomerData.totalCredit.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Cart Items - Tabbed Area */}
          <div className="flex-1 min-h-0 bg-muted/10">
            <Tabs defaultValue="sale" className="h-full flex flex-col">
              <div className="px-4 pt-2 border-b bg-background">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sale" className="gap-2">
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    To Issue ({cart.length})
                  </TabsTrigger>
                  <TabsTrigger value="return" className="gap-2">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Returns ({returnedBottles.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="sale" className="flex-1 overflow-y-auto m-0 relative">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-12">
                    <Package className="h-10 w-10 mb-2 opacity-20" />
                    <p className="font-medium text-sm">No bottles added</p>
                    <p className="text-xs">Click on bottles to add</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.uid}
                        className="p-3 bg-card border rounded-lg group hover:border-primary/50 transition-all shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-gradient-to-b from-emerald-500 to-emerald-300 rounded-full" />
                            <div>
                              <p className="text-xs text-muted-foreground leading-none">{item.bottleTypeName} ({item.capacityLiters}L)</p>
                              <p className="text-sm font-bold mt-1">Rs.{item.price}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={() => removeFromCart(item.uid)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="relative">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Serial Number (Optional)</Label>
                          <Input
                            placeholder="Enter or scan serial..."
                            className="h-8 text-xs bg-muted/30"
                            value={item.serialNumber}
                            onChange={(e) => updateCartItemSerial(item.uid, e.target.value)}
                          />
                          {item.bottleId && (
                            <Badge variant="secondary" className="absolute right-2 top-6 h-4 text-[8px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                              Linked
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="return" className="flex-1 overflow-y-auto m-0 relative flex flex-col">
                <div className="p-3 border-b bg-background/50 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Serial Number</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter serial..."
                        className="h-8 text-sm"
                        value={returnSerial}
                        onChange={(e) => setReturnSerial(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addReturn()}
                      />
                      <Button size="sm" className="h-8 w-8 p-0" onClick={addReturn}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Bottle Type (for new bottles)</Label>
                    <Select value={returnTypeId} onValueChange={setReturnTypeId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {bottleTypes.map(t => (
                          <SelectItem key={t.id} value={t.id} className="text-xs">
                            {t.name} ({t.capacityLiters}L)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {returnedBottles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                      <RotateCcw className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-xs">No returns added yet</p>
                    </div>
                  ) : (
                    returnedBottles.map((ret) => (
                      <div
                        key={ret.serialNumber}
                        className="p-2 bg-card border border-amber-200 bg-amber-50/30 rounded-lg group space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-1.5 h-8 bg-amber-400 rounded-full" />
                            <div className="flex-1">
                              <p className="text-[10px] text-muted-foreground">{ret.bottleTypeName}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={() => removeReturn(ret.serialNumber)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="relative">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Serial Number</Label>
                          <Input
                            placeholder="Enter return serial..."
                            className="h-8 text-xs bg-amber-50/50"
                            value={ret.serialNumber}
                            onChange={(e) => updateReturnSerial(ret.serialNumber, e.target.value)}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Payment Section - Fixed at Bottom */}
          <div className="p-3 space-y-3 bg-card border-t shrink-0 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] z-10">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Bottles</span>
              <Badge variant="secondary" className="px-2">{cart.length}</Badge>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-bold">Total</span>
              <span className="text-xl font-bold text-primary">Rs. {total.toLocaleString()}</span>
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'cash', label: 'Cash', icon: Banknote, color: 'emerald' },
                { value: 'partial', label: 'Part', icon: CreditCard, color: 'amber' },
                { value: 'credit', label: 'Credit', icon: Receipt, color: 'red' },
              ].map((method) => (
                <Button
                  key={method.value}
                  variant={paymentMethod === method.value ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-9 gap-1.5',
                    paymentMethod === method.value && method.color === 'emerald' && 'bg-emerald-600 hover:bg-emerald-700',
                    paymentMethod === method.value && method.color === 'amber' && 'bg-amber-600 hover:bg-amber-700',
                    paymentMethod === method.value && method.color === 'red' && 'bg-red-600 hover:bg-red-700'
                  )}
                  onClick={() => {
                    setPaymentMethod(method.value as 'cash' | 'partial' | 'credit');
                  }}
                >
                  <method.icon className="h-3.5 w-3.5" />
                  <span className="text-xs">{method.label}</span>
                </Button>
              ))}
            </div>

            {paymentMethod !== 'credit' && (
              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">Received</Label>
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      value={amountPaid || ''}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block text-emerald-600">Change</Label>
                    <div className="h-8 px-3 flex items-center bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-200 dark:border-emerald-800 text-sm font-bold text-emerald-600">
                      {changeAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'partial' && creditAmount > 0 && (
              <div className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg">
                <span className="text-xs text-destructive font-medium">Credit Amount</span>
                <span className="text-sm font-bold text-destructive">Rs. {creditAmount.toLocaleString()}</span>
              </div>
            )}

            <Button
              onClick={handleCheckout}
              disabled={!selectedCustomer || cart.length === 0 || processing}
              className="w-full h-10 text-sm font-semibold gap-2 mt-1"
            >
              {processing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {paymentMethod === 'cash' ? 'Complete Sale' : `Complete (Credit: Rs.${creditAmount})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={(open) => !open && handleSuccessClose()}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl">Sale Complete!</DialogTitle>
              <DialogDescription className="text-base space-y-1">
                <div className="flex items-center justify-center gap-4 text-sm mt-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-medium">
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Issued: {lastSale?.bottleCount || cart.length}
                  </div>
                  {(lastSale?.returnCount || returnedBottles.length) > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md font-medium">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Returned: {lastSale?.returnCount || returnedBottles.length}
                    </div>
                  )}
                </div>
                <p className="mt-2 font-medium">{selectedCustomerData?.name}</p>
              </DialogDescription>
            </DialogHeader>

            {lastSale?.invoiceNumber && (
              <Badge variant="outline" className="mt-4 text-base px-4 py-1 gap-2">
                <FileText className="h-4 w-4" />
                {lastSale.invoiceNumber}
              </Badge>
            )}

            {creditAmount > 0 && (
              <Badge variant="destructive" className="mt-4 text-base px-4 py-1">
                Credit Added: Rs. {creditAmount.toLocaleString()}
              </Badge>
            )}

            <div className="flex flex-col w-full gap-3 mt-8">
              <Button
                size="lg"
                className="w-full h-12 text-base font-bold shadow-md hover:shadow-lg transition-all"
                onClick={handleSuccessClose}
              >
                New Sale
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (lastSale?.saleId && lastSale?.invoiceNumber) {
                      pdfService.openPdf(pdfService.getInvoiceUrl(lastSale.saleId));
                    }
                  }}
                  className="gap-2 h-11"
                >
                  <Printer className="h-4 w-4" />
                  Receipt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (lastSale?.saleId && lastSale?.invoiceNumber) {
                      pdfService.downloadInvoice(lastSale.saleId, lastSale.invoiceNumber);
                    }
                  }}
                  className="gap-2 h-11"
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Customer Modal */}
      <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="h-6 w-6 text-primary" />
              Quick Registration
            </DialogTitle>
            <DialogDescription>
              Register a new customer to continue with the sale.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterCustomer} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. 07X XXX XXXX"
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Customer location"
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="bg-muted/30"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowRegisterModal(false)}
                disabled={isRegistering}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={isRegistering || !newCustomer.name || !newCustomer.phone}
              >
                {isRegistering ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Complete & Select
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
