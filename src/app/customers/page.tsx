'use client';

import { useState, useEffect } from 'react';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { CustomerTransactionsTable } from '@/components/customers/CustomerTransactionsTable';
import { IssueBottleModal } from '@/components/customers/IssueBottleModal';
import { ReturnBottleModal } from '@/components/customers/ReturnBottleModal';
import { CollectPaymentModal } from '@/components/customers/CollectPaymentModal';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Separator,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { StatCard } from '@/components/dashboard';
import { customerService, bottleService } from '@/services';
import { bottleTypes } from '@/data';
import { Customer, CustomerTransaction, OxygenBottle, BottleType } from '@/types';
import {
  Users,
  Package,
  CreditCard,
  CircleCheck,
  PackagePlus,
  PackageMinus,
  Banknote,
  UserPlus,
  AlertTriangle,
  X,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [bottles, setBottles] = useState<OxygenBottle[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [custs, txns, btls] = await Promise.all([
        customerService.getAll(),
        customerService.getTransactions(),
        bottleService.getAll(),
      ]);
      setCustomers(custs);
      setTransactions(txns);
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

  const totalCredit = customers.reduce((sum, c) => sum + c.totalCredit, 0);
  const totalBottlesOut = bottles.filter((b) => b.status === 'with_customer').length;
  const filledBottles = bottles.filter((b) => b.status === 'filled');
  const bottlesWithCustomers = bottles.filter((b) => b.status === 'with_customer');

  const filteredTransactions = selectedCustomer
    ? transactions.filter((t) => t.customerId === selectedCustomer.id)
    : transactions;

  const handleIssueBottles = async (data: {
    customerId: string;
    bottleIds: string[];
    totalAmount: number;
    amountPaid: number;
    paymentStatus: 'full' | 'partial' | 'credit';
  }) => {
    const customer = customers.find((c) => c.id === data.customerId);
    if (!customer) return;

    // Get bottle info
    const issuedBottles = bottles.filter((b) => data.bottleIds.includes(b.id));
    const bottleType = issuedBottles[0]
      ? bottleTypes.find((t) => t.capacityLiters === issuedBottles[0].capacityLiters)?.name ||
        'Mixed'
      : 'Mixed';

    // Optimistic UI update - Update bottles status
    setBottles((prev) =>
      prev.map((bottle) =>
        data.bottleIds.includes(bottle.id)
          ? {
              ...bottle,
              status: 'with_customer' as const,
              customerId: data.customerId,
              customerName: customer.name,
              issuedDate: new Date().toISOString(),
            }
          : bottle
      )
    );

    // Update customer
    const creditAmount = data.totalAmount - data.amountPaid;
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === data.customerId
          ? {
              ...c,
              bottlesInHand: c.bottlesInHand + data.bottleIds.length,
              totalCredit: c.totalCredit + creditAmount,
            }
          : c
      )
    );

    // Add transaction locally
    const newTransaction: CustomerTransaction = {
      id: `ct-${Date.now()}`,
      customerId: data.customerId,
      customerName: customer.name,
      transactionType: 'issue',
      bottleIds: data.bottleIds,
      bottleCount: data.bottleIds.length,
      bottleType,
      totalAmount: data.totalAmount,
      amountPaid: data.amountPaid,
      creditAmount,
      paymentStatus: data.paymentStatus,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTransaction, ...prev]);

    // Call API to sync with backend
    try {
      await customerService.issueBottles({
        customerId: data.customerId,
        bottleIds: data.bottleIds,
        totalAmount: data.totalAmount,
        amountPaid: data.amountPaid,
        paymentStatus: data.paymentStatus,
      });
    } catch (err) {
      console.error('Failed to sync issue bottles with server:', err);
    }
  };

  const handleReturnBottles = async (data: { customerId: string; bottleIds: string[] }) => {
    const customer = customers.find((c) => c.id === data.customerId);
    if (!customer) return;

    // Get bottle info for transaction
    const returnedBottles = bottles.filter((b) => data.bottleIds.includes(b.id));
    const bottleType = returnedBottles[0]
      ? bottleTypes.find((t) => t.capacityLiters === returnedBottles[0].capacityLiters)?.name ||
        'Mixed'
      : 'Mixed';

    // Optimistic UI update - Update bottles status to empty
    setBottles((prev) =>
      prev.map((bottle) =>
        data.bottleIds.includes(bottle.id)
          ? {
              ...bottle,
              status: 'empty' as const,
              customerId: undefined,
              customerName: undefined,
              issuedDate: undefined,
            }
          : bottle
      )
    );

    // Update customer bottles count
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === data.customerId
          ? {
              ...c,
              bottlesInHand: Math.max(0, c.bottlesInHand - data.bottleIds.length),
            }
          : c
      )
    );

    // Add return transaction locally
    const newTransaction: CustomerTransaction = {
      id: `ct-${Date.now()}`,
      customerId: data.customerId,
      customerName: customer.name,
      transactionType: 'return',
      bottleIds: data.bottleIds,
      bottleCount: data.bottleIds.length,
      bottleType,
      totalAmount: 0,
      amountPaid: 0,
      creditAmount: 0,
      paymentStatus: 'full',
      notes: 'Empty bottles returned',
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTransaction, ...prev]);

    // Call API to sync with backend
    try {
      await customerService.returnBottles({
        customerId: data.customerId,
        bottleIds: data.bottleIds,
        notes: 'Empty bottles returned',
      });
    } catch (err) {
      console.error('Failed to sync return bottles with server:', err);
      // Could add error handling/rollback here if needed
    }
  };

  const handleCollectPayment = async (data: { customerId: string; amount: number }) => {
    const customer = customers.find((c) => c.id === data.customerId);
    if (!customer) return;

    // Optimistic UI update - Update customer credit
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === data.customerId
          ? {
              ...c,
              totalCredit: Math.max(0, c.totalCredit - data.amount),
              loyaltyPoints: c.loyaltyPoints + Math.floor(data.amount / 100),
            }
          : c
      )
    );

    // Call API to sync with backend
    try {
      await customerService.collectPayment({
        customerId: data.customerId,
        amount: data.amount,
        notes: 'Payment collected',
      });
    } catch (err) {
      console.error('Failed to sync payment with server:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">Manage customers, bottles, and credits</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowPaymentModal(true)} variant="outline" className="gap-2">
            <Banknote className="h-4 w-4" />
            Collect Payment
          </Button>
          <Button onClick={() => setShowReturnModal(true)} variant="outline" className="gap-2">
            <PackageMinus className="h-4 w-4" />
            Return Bottles
          </Button>
          <Button onClick={() => setShowIssueModal(true)} variant="secondary" className="gap-2">
            <PackagePlus className="h-4 w-4" />
            Issue Bottles
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={customers.length}
          icon={Users}
          color="cyan"
        />
        <StatCard
          title="Bottles with Customers"
          value={totalBottlesOut}
          icon={Package}
          color="purple"
        />
        <StatCard
          title="Total Outstanding"
          value={`Rs. ${totalCredit.toLocaleString()}`}
          icon={CreditCard}
          color="orange"
        />
        <StatCard
          title="Ready to Issue"
          value={filledBottles.length}
          icon={CircleCheck}
          color="green"
        />
      </div>

      {/* Customers with Credit Warning */}
      {customers.filter((c) => c.totalCredit > 0).length > 0 && (
        <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-amber-800 dark:text-amber-300">Customers with Outstanding Credit</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {customers
                .filter((c) => c.totalCredit > 0)
                .sort((a, b) => b.totalCredit - a.totalCredit)
                .map((c) => (
                  <Button
                    key={c.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCustomer(c)}
                    className="bg-card border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  >
                    <span className="font-medium">{c.name}</span>
                    <Badge variant="destructive" className="ml-2">Rs. {c.totalCredit.toLocaleString()}</Badge>
                  </Button>
                ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Customer Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">All Customers</h2>
          {selectedCustomer && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
              Clear Filter
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className={`transition-all ${
                selectedCustomer?.id === customer.id
                  ? 'ring-2 ring-cyan-500 rounded-xl'
                  : ''
              }`}
            >
              <CustomerCard
                customer={customer}
                bottles={bottles}
                onClick={(c) =>
                  setSelectedCustomer(selectedCustomer?.id === c.id ? null : c)
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Selected Customer Details */}
      {selectedCustomer && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {selectedCustomer.name} - Details
            </CardTitle>
            <div className="flex gap-2">
              {selectedCustomer.totalCredit > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPaymentModal(true)}
                  className="gap-2"
                >
                  <Banknote className="h-4 w-4" />
                  Collect Payment
                </Button>
              )}
              {bottles.filter((b) => b.customerId === selectedCustomer.id).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReturnModal(true)}
                  className="gap-2"
                >
                  <PackageMinus className="h-4 w-4" />
                  Return Bottles
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setShowIssueModal(true)}
                className="gap-2"
              >
                <PackagePlus className="h-4 w-4" />
                Issue More
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-4">
            {/* Customer's bottles */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Bottles in Customer's Possession ({selectedCustomer.bottlesInHand})
              </h4>
              <div className="flex flex-wrap gap-2">
                {bottles
                  .filter((b) => b.customerId === selectedCustomer.id)
                  .map((bottle) => (
                    <Badge
                      key={bottle.id}
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    >
                      {bottle.serialNumber} ({bottle.capacityLiters}L)
                    </Badge>
                  ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Transaction History</h4>
              <CustomerTransactionsTable
                transactions={filteredTransactions}
                showCustomerName={false}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Transactions */}
      {!selectedCustomer && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          <CustomerTransactionsTable transactions={transactions} />
        </div>
      )}

      {/* Add Customer Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add New Customer
            </DialogTitle>
            <DialogDescription>
              Enter the customer details below to create a new customer account.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newCustomer: Customer = {
                id: `cust-${Date.now()}`,
                name: formData.get('name') as string,
                phone: formData.get('phone') as string,
                email: formData.get('email') as string,
                address: formData.get('address') as string,
                loyaltyPoints: 0,
                totalCredit: 0,
                bottlesInHand: 0,
                createdAt: new Date().toISOString(),
              };
              setCustomers((prev) => [...prev, newCustomer]);
              setShowAddModal(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Customer Name
              </Label>
              <Input
                name="name"
                type="text"
                required
                placeholder="Enter customer name"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone
              </Label>
              <Input
                name="phone"
                type="tel"
                required
                placeholder="+94 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                name="email"
                type="email"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Address
              </Label>
              <Input
                name="address"
                placeholder="Enter address"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 gap-2">
                <UserPlus className="h-4 w-4" />
                Add Customer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue Bottles Modal */}
      <IssueBottleModal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        onIssue={handleIssueBottles}
        filledBottles={filledBottles}
        customers={customers}
        bottleTypes={bottleTypes}
      />

      {/* Return Bottles Modal */}
      <ReturnBottleModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onReturn={handleReturnBottles}
        customers={customers}
        bottlesWithCustomers={bottlesWithCustomers}
      />

      {/* Collect Payment Modal */}
      <CollectPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onCollect={handleCollectPayment}
        customers={customers}
      />
    </div>
  );
}
